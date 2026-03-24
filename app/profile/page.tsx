"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  useAllTravelPreferences,
  useUserPreferences,
  useUpdateUserPreferencesMutation,
  useRecommendationPreferences,
  useUpdateRecommendationPreferencesMutation,
} from "@/hooks/api/usePreferences";
import { useUserTravelStats } from "@/hooks/api/useUser";
import { useCategories } from "@/hooks/api/useCategories";
import { useChangePasswordMutation } from "@/hooks/api/useAuth";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Mail,
  Shield,
  Key,
  Eye,
  EyeOff,
  Check,
  X,
  Camera,
  MapPin,
  Mountain,
  Waves,
  TreePine,
  Landmark,
  Utensils,
  ChevronRight,
  Sparkles,
  Globe,
  Calendar,
  Heart,
  Star,
  Settings,
  Bell,
  LogOut,
  Award,
  TrendingUp,
  Compass,
  EyeOff as EyeOffIcon,
} from "lucide-react";

const heroImage =
  "https://images.unsplash.com/photo-1760638096645-be1efc495937?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080";

const TRAVEL_PREFERENCE_CATALOG = [
  {
    id: 1,
    name: "วัดและโบราณสถาน",
    nameEn: "Temples & Heritage",
    icon: Landmark,
    color: "#f59e0b",
  },
  {
    id: 2,
    name: "ภูเขาและป่าไม้",
    nameEn: "Mountains & Forest",
    icon: Mountain,
    color: "#22c55e",
  },
  {
    id: 3,
    name: "ทะเลและชายหาด",
    nameEn: "Beach & Sea",
    icon: Waves,
    color: "#3b82f6",
  },
  {
    id: 4,
    name: "อาหารท้องถิ่น",
    nameEn: "Local Food",
    icon: Utensils,
    color: "#ef4444",
  },
  {
    id: 5,
    name: "ธรรมชาติ",
    nameEn: "Nature",
    icon: TreePine,
    color: "#10b981",
  },
  {
    id: 6,
    name: "ผจญภัย",
    nameEn: "Adventure",
    icon: Compass,
    color: "#8b5cf6",
  },
  { id: 7, name: "วัฒนธรรม", nameEn: "Culture", icon: Globe, color: "#ec4899" },
  {
    id: 8,
    name: "ถ่ายรูป",
    nameEn: "Photography",
    icon: Camera,
    color: "#06b6d4",
  },
  {
    id: 9,
    name: "เทศกาล",
    nameEn: "Festivals",
    icon: Calendar,
    color: "#f97316",
  },
  {
    id: 10,
    name: "Hidden Gem",
    nameEn: "Hidden Gems",
    icon: Sparkles,
    color: "#eab308",
  },
];

const DEFAULT_PREFERENCE_STYLE = {
  nameEn: "Travel Interest",
  icon: Compass,
  color: "#10b981",
};

type PreferenceDisplayItem = {
  id: number;
  name: string;
  nameEn: string;
  icon: typeof Compass;
  color: string;
};

function getPreferencePresentation(preference: { id: number; name: string }) {
  const byName = TRAVEL_PREFERENCE_CATALOG.find(
    (item) => item.name === preference.name,
  );
  const byId = TRAVEL_PREFERENCE_CATALOG.find(
    (item) => item.id === preference.id,
  );
  const matched = byName ?? byId;

  return {
    id: preference.id,
    name: preference.name,
    nameEn: matched?.nameEn ?? DEFAULT_PREFERENCE_STYLE.nameEn,
    icon: matched?.icon ?? DEFAULT_PREFERENCE_STYLE.icon,
    color: matched?.color ?? DEFAULT_PREFERENCE_STYLE.color,
  };
}

const REGIONS = [
  { value: "North", label: "ภาคเหนือ", labelEn: "North" },
  { value: "Northeast", label: "ภาคอีสาน", labelEn: "Northeast" },
  { value: "Central", label: "ภาคกลาง", labelEn: "Central" },
  { value: "East", label: "ภาคตะวันออก", labelEn: "East" },
  { value: "West", label: "ภาคตะวันตก", labelEn: "West" },
  { value: "South", label: "ภาคใต้", labelEn: "South" },
];

const NOTIFICATION_SETTINGS = [
  {
    id: "new_places",
    label: "สถานที่ใหม่",
    desc: "แจ้งเตือนเมื่อมีสถานที่ใหม่ในภูมิภาคที่สนใจ",
  },
  { id: "trip_reminder", label: "เตือนทริป", desc: "แจ้งเตือนก่อนวันเดินทาง" },
  { id: "deals", label: "โปรโมชัน", desc: "ข้อเสนอพิเศษและส่วนลด" },
  { id: "community", label: "ชุมชน", desc: "รีวิวและความคิดเห็นจากนักเดินทาง" },
];

const CATEGORY_FALLBACK_IDS = {
  accommodation: 2,
  attraction: 3,
  shop: 6,
  restaurant: 8,
  other: 13,
};

const TRAVEL_PREF_TO_RECOMMENDATION_CATEGORY: Record<
  number,
  Array<keyof typeof CATEGORY_FALLBACK_IDS>
> = {
  1: ["attraction"],
  2: ["attraction"],
  3: ["attraction"],
  4: ["restaurant"],
  5: ["attraction"],
  6: ["attraction"],
  7: ["attraction"],
  8: ["attraction"],
  9: ["other"],
  10: ["other", "attraction"],
};

function resolveCategoryIdByName(
  categories: Array<{ id: number; name: string; nameEn: string }>,
  key: keyof typeof CATEGORY_FALLBACK_IDS,
) {
  const keyword = key.toLowerCase();
  const matched = categories.find((category) => {
    const name = `${category.name} ${category.nameEn}`.toLowerCase();
    return name.includes(keyword);
  });
  return matched?.id ?? CATEGORY_FALLBACK_IDS[key];
}

function mapTravelPrefsToRecommendationCategoryIds(
  selectedPreferenceIds: number[],
  categories: Array<{ id: number; name: string; nameEn: string }>,
) {
  const selectedCategoryKeys = new Set<keyof typeof CATEGORY_FALLBACK_IDS>();

  selectedPreferenceIds.forEach((preferenceId) => {
    const mappedKeys =
      TRAVEL_PREF_TO_RECOMMENDATION_CATEGORY[preferenceId] ?? [];
    mappedKeys.forEach((key) => selectedCategoryKeys.add(key));
  });

  if (selectedCategoryKeys.size === 0 && selectedPreferenceIds.length > 0) {
    selectedCategoryKeys.add("attraction");
  }

  return Array.from(selectedCategoryKeys).map((key) =>
    resolveCategoryIdByName(categories, key),
  );
}

function AnimatedCounter({
  value,
  duration = 1.5,
}: {
  value: number;
  duration?: number;
}) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const animate = (now: number) => {
            const elapsed = (now - start) / (duration * 1000);
            if (elapsed >= 1) {
              setCount(value);
              return;
            }
            setCount(Math.floor(value * elapsed));
            requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.5 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value, duration]);

  return <span ref={ref}>{count}</span>;
}

function HeroParticles() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: Math.random() * 4 + 2,
            height: Math.random() * 4 + 2,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            background: `rgba(${Math.random() > 0.5 ? "16,185,129" : "255,255,255"}, ${Math.random() * 0.4 + 0.1})`,
          }}
          animate={{
            y: [0, -30 - Math.random() * 40, 0],
            x: [0, Math.random() * 20 - 10, 0],
            opacity: [0.2, 0.8, 0.2],
          }}
          transition={{
            duration: 4 + Math.random() * 4,
            repeat: Infinity,
            delay: Math.random() * 3,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

function ChangePasswordDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const changePasswordMutation = useChangePasswordMutation();

  const validate = () => {
    const e: Record<string, string> = {};
    if (!currentPassword) e.current = "กรุณากรอกรหัสผ่านปัจจุบัน";
    if (newPassword.length < 12) e.new = "รหัสผ่านต้องมีอย่างน้อย 12 ตัวอักษร";
    else if (!/[A-Z]/.test(newPassword))
      e.new = "ต้องมีตัวพิมพ์ใหญ่อย่างน้อย 1 ตัว";
    else if (!/[a-z]/.test(newPassword))
      e.new = "ต้องมีตัวพิมพ์เล็กอย่างน้อย 1 ตัว";
    else if (!/[0-9]/.test(newPassword)) e.new = "ต้องมีตัวเลขอย่างน้อย 1 ตัว";
    else if (!/[^A-Za-z0-9]/.test(newPassword))
      e.new = "ต้องมีสัญลักษณ์อย่างน้อย 1 ตัว";
    if (newPassword !== confirmPassword) e.confirm = "รหัสผ่านไม่ตรงกัน";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const passwordStrength = (() => {
    let s = 0;
    if (newPassword.length >= 12) s++;
    if (/[A-Z]/.test(newPassword)) s++;
    if (/[a-z]/.test(newPassword)) s++;
    if (/[0-9]/.test(newPassword)) s++;
    if (/[^A-Za-z0-9]/.test(newPassword)) s++;
    return s;
  })();

  const strengthLabel = [
    "",
    "อ่อนมาก",
    "อ่อน",
    "ปานกลาง",
    "แข็งแรง",
    "แข็งแรงมาก",
  ][passwordStrength];
  const strengthColor = [
    "",
    "#ef4444",
    "#f97316",
    "#eab308",
    "#22c55e",
    "#10b981",
  ][passwordStrength];

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await changePasswordMutation.mutateAsync({
        oldPassword: currentPassword,
        newPassword: newPassword,
      });
      toast.success("เปลี่ยนรหัสผ่านสำเร็จ!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to change password");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
          >
            <div className="relative bg-gradient-to-r from-[#0f1923] to-[#1a2f3f] p-6 pb-5">
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 80% 20%, #10b981 0%, transparent 50%)",
                }}
              />
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                    <Key className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-white" style={{ fontSize: 18 }}>
                      เปลี่ยนรหัสผ่าน
                    </h3>
                    <p className="text-white/50" style={{ fontSize: 13 }}>
                      Change Password
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="text-white/40 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label
                  className="text-gray-700 mb-1.5 block"
                  style={{ fontSize: 13 }}
                >
                  รหัสผ่านปัจจุบัน
                </label>
                <div className="relative">
                  <input
                    type={showCurrent ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full h-11 rounded-xl border border-gray-200 px-4 pr-11 bg-gray-50 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                    style={{ fontSize: 14 }}
                    placeholder="••••••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showCurrent ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {errors.current && (
                  <p className="text-red-500 mt-1" style={{ fontSize: 12 }}>
                    {errors.current}
                  </p>
                )}
              </div>

              <div>
                <label
                  className="text-gray-700 mb-1.5 block"
                  style={{ fontSize: 13 }}
                >
                  รหัสผ่านใหม่
                </label>
                <div className="relative">
                  <input
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full h-11 rounded-xl border border-gray-200 px-4 pr-11 bg-gray-50 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                    style={{ fontSize: 14 }}
                    placeholder="อย่างน้อย 12 ตัวอักษร"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showNew ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {errors.new && (
                  <p className="text-red-500 mt-1" style={{ fontSize: 12 }}>
                    {errors.new}
                  </p>
                )}

                {newPassword.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-2"
                  >
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className="h-1 flex-1 rounded-full transition-all duration-300"
                          style={{
                            backgroundColor:
                              i <= passwordStrength ? strengthColor : "#e5e7eb",
                          }}
                        />
                      ))}
                    </div>
                    <p style={{ fontSize: 11, color: strengthColor }}>
                      {strengthLabel}
                    </p>
                  </motion.div>
                )}

                <div className="mt-2 space-y-1">
                  {[
                    { ok: newPassword.length >= 12, text: "12 ตัวอักษรขึ้นไป" },
                    {
                      ok: /[A-Z]/.test(newPassword),
                      text: "ตัวพิมพ์ใหญ่ (A-Z)",
                    },
                    {
                      ok: /[a-z]/.test(newPassword),
                      text: "ตัวพิมพ์เล็ก (a-z)",
                    },
                    { ok: /[0-9]/.test(newPassword), text: "ตัวเลข (0-9)" },
                    {
                      ok: /[^A-Za-z0-9]/.test(newPassword),
                      text: "สัญลักษณ์ (!@#$...)",
                    },
                  ].map((r, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-1.5"
                      style={{ fontSize: 11 }}
                    >
                      {r.ok ? (
                        <Check className="w-3 h-3 text-emerald-500" />
                      ) : (
                        <div className="w-3 h-3 rounded-full border border-gray-300" />
                      )}
                      <span
                        className={r.ok ? "text-emerald-600" : "text-gray-400"}
                      >
                        {r.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label
                  className="text-gray-700 mb-1.5 block"
                  style={{ fontSize: 13 }}
                >
                  ยืนยันรหัสผ่านใหม่
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full h-11 rounded-xl border border-gray-200 px-4 pr-11 bg-gray-50 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                    style={{ fontSize: 14 }}
                    placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirm ? (
                      <EyeOffIcon className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {errors.confirm && (
                  <p className="text-red-500 mt-1" style={{ fontSize: 12 }}>
                    {errors.confirm}
                  </p>
                )}
                {confirmPassword && newPassword === confirmPassword && (
                  <p
                    className="text-emerald-500 mt-1 flex items-center gap-1"
                    style={{ fontSize: 12 }}
                  >
                    <Check className="w-3 h-3" /> รหัสผ่านตรงกัน
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={onClose}
                  className="flex-1 h-11 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                  style={{ fontSize: 14 }}
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={saving}
                  className="flex-1 h-11 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                  style={{ fontSize: 14 }}
                >
                  {saving ? (
                    <motion.div
                      className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    />
                  ) : (
                    <>
                      <Shield className="w-4 h-4" />
                      บันทึก
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  delay,
}: {
  icon: any;
  label: string;
  value: number;
  color: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: "spring", stiffness: 200, damping: 20 }}
      className="relative bg-white rounded-2xl p-5 shadow-sm border border-gray-100 overflow-hidden group hover:shadow-md transition-shadow"
    >
      <div
        className="absolute top-0 right-0 w-24 h-24 rounded-bl-[60px] opacity-10 transition-opacity group-hover:opacity-20"
        style={{ background: color }}
      />
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
        style={{ background: `${color}15` }}
      >
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div style={{ fontSize: 28, color: "#0f1923", fontWeight: 700 }}>
        <AnimatedCounter value={value} />
      </div>
      <p className="text-gray-500" style={{ fontSize: 13 }}>
        {label}
      </p>
    </motion.div>
  );
}

function PreferenceChip({
  pref,
  selected,
  onClick,
  delay,
}: {
  pref: PreferenceDisplayItem;
  selected: boolean;
  onClick: () => void;
  delay: number;
}) {
  const Icon = pref.icon;
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, type: "spring", stiffness: 300, damping: 22 }}
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`relative flex items-center gap-2.5 px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
        selected
          ? "border-emerald-500 bg-emerald-50 shadow-md shadow-emerald-500/10"
          : "border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm"
      }`}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
        style={{
          background: selected ? `${pref.color}20` : "#f3f4f6",
        }}
      >
        <Icon
          className="w-4 h-4"
          style={{ color: selected ? pref.color : "#9ca3af" }}
        />
      </div>
      <div className="text-left">
        <p
          style={{
            fontSize: 13,
            color: selected ? "#0f1923" : "#6b7280",
            fontWeight: 500,
          }}
        >
          {pref.name}
        </p>
        <p style={{ fontSize: 11, color: selected ? "#6b7280" : "#9ca3af" }}>
          {pref.nameEn}
        </p>
      </div>
      {selected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center"
        >
          <Check className="w-3 h-3 text-white" />
        </motion.div>
      )}
    </motion.button>
  );
}

function RegionToggle({
  region,
  selected,
  onClick,
}: {
  region: (typeof REGIONS)[0];
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`px-4 py-2.5 rounded-xl border transition-all ${
        selected
          ? "border-emerald-500 bg-emerald-50 text-emerald-700"
          : "border-gray-100 bg-white text-gray-500 hover:border-gray-200"
      }`}
    >
      <p style={{ fontSize: 13, fontWeight: 500 }}>{region.label}</p>
      <p style={{ fontSize: 11, color: selected ? "#059669" : "#9ca3af" }}>
        {region.labelEn}
      </p>
    </motion.button>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [savingRecPrefs, setSavingRecPrefs] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "account" | "preferences" | "notifications"
  >("account");
  const MAX_SELECTION = 5;

  const { data: allPreferences = [], isLoading: loadingPreferences } =
    useAllTravelPreferences();
  const { data: userPreferences = [], isLoading: loadingUserPreferences } =
    useUserPreferences();
  const updatePreferencesMutation = useUpdateUserPreferencesMutation();

  const { data: categories = [], isLoading: loadingCategories } =
    useCategories();
  const { data: recPrefs, isLoading: loadingRecPrefs } =
    useRecommendationPreferences();
  const updateRecPrefsMutation = useUpdateRecommendationPreferencesMutation();

  const { data: userStats, isLoading: loadingStats } = useUserTravelStats();

  const [selectedPreferenceIds, setSelectedPreferenceIds] = useState<number[]>(
    [],
  );
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<Record<string, boolean>>({
    new_places: true,
    trip_reminder: true,
    deals: false,
    community: true,
  });

  const selectablePreferences = useMemo(() => {
    if (allPreferences.length > 0) {
      return allPreferences;
    }

    if (userPreferences.length > 0) {
      return userPreferences;
    }

    return [] as Array<{ id: number; name: string }>;
  }, [allPreferences, userPreferences]);

  const displayPreferences = useMemo<PreferenceDisplayItem[]>(() => {
    if (selectablePreferences.length > 0) {
      return selectablePreferences.map((preference) =>
        getPreferencePresentation(preference),
      );
    }

    return TRAVEL_PREFERENCE_CATALOG.map((preference) => ({
      ...preference,
    }));
  }, [selectablePreferences]);

  const preferenceIdSet = useMemo(
    () => new Set(selectablePreferences.map((preference) => preference.id)),
    [selectablePreferences],
  );

  const canEditPreferences =
    !loadingPreferences &&
    !loadingUserPreferences &&
    selectablePreferences.length > 0;

  const showPreferenceDataMissing =
    !loadingPreferences &&
    !loadingUserPreferences &&
    selectablePreferences.length === 0;

  const mappedCategoryIdsPreview = useMemo(
    () =>
      mapTravelPrefsToRecommendationCategoryIds(
        selectedPreferenceIds,
        categories,
      ),
    [selectedPreferenceIds, categories],
  );

  const previewCategoryLabels = useMemo(() => {
    return mappedCategoryIdsPreview.map((categoryId) => {
      const matched = categories.find((category) => category.id === categoryId);
      return matched?.nameEn ?? `Category ${categoryId}`;
    });
  }, [mappedCategoryIdsPreview, categories]);

  useEffect(() => {
    if (!canEditPreferences) {
      return;
    }

    setSelectedPreferenceIds(
      userPreferences
        .map((preference) => preference.id)
        .filter((id) => preferenceIdSet.has(id)),
    );
  }, [canEditPreferences, userPreferences, preferenceIdSet]);

  useEffect(() => {
    if (recPrefs) {
      setSelectedCategoryIds(recPrefs.preferredCategoryIds ?? []);
      setSelectedRegions(recPrefs.preferredRegions ?? []);
    }
  }, [recPrefs]);

  const togglePreference = (prefId: number) => {
    if (!canEditPreferences) {
      return;
    }

    if (selectedPreferenceIds.includes(prefId)) {
      setSelectedPreferenceIds(
        selectedPreferenceIds.filter((id) => id !== prefId),
      );
    } else {
      if (selectedPreferenceIds.length >= MAX_SELECTION) {
        toast.warning(`เลือกได้สูงสุด ${MAX_SELECTION} หมวดหมู่`);
        return;
      }
      setSelectedPreferenceIds([...selectedPreferenceIds, prefId]);
    }
  };

  const toggleCategory = (catId: number) => {
    if (selectedCategoryIds.includes(catId)) {
      setSelectedCategoryIds(selectedCategoryIds.filter((id) => id !== catId));
    } else {
      setSelectedCategoryIds([...selectedCategoryIds, catId]);
    }
  };

  const toggleRegion = (region: string) => {
    if (selectedRegions.includes(region)) {
      setSelectedRegions(selectedRegions.filter((r) => r !== region));
    } else {
      setSelectedRegions([...selectedRegions, region]);
    }
  };

  const savePreferences = async () => {
    if (!canEditPreferences) {
      toast.error("กำลังโหลดตัวเลือกความชอบ กรุณาลองอีกครั้ง");
      return;
    }

    setSavingPrefs(true);
    try {
      const preferenceIds = selectedPreferenceIds.filter((id) =>
        preferenceIdSet.has(id),
      );

      if (preferenceIds.length !== selectedPreferenceIds.length) {
        toast.error("มีบางหมวดหมู่ไม่ถูกต้อง กรุณาเลือกใหม่");
        setSelectedPreferenceIds(preferenceIds);
        return;
      }

      const mappedCategoryIds = mapTravelPrefsToRecommendationCategoryIds(
        preferenceIds,
        categories,
      );

      await Promise.all([
        updatePreferencesMutation.mutateAsync({
          preferenceIds,
        }),
        updateRecPrefsMutation.mutateAsync({
          preferredCategoryIds: mappedCategoryIds,
          preferredRegions: selectedRegions,
        }),
      ]);

      setSelectedCategoryIds(mappedCategoryIds);
      toast.success("บันทึกความชอบและอัปเดตคำแนะนำเรียบร้อย!");
      router.push("/");
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to save preferences",
      );
    } finally {
      setSavingPrefs(false);
    }
  };

  const saveRecommendationPreferences = async () => {
    setSavingRecPrefs(true);
    try {
      await updateRecPrefsMutation.mutateAsync({
        preferredCategoryIds: selectedCategoryIds,
        preferredRegions: selectedRegions,
      });
      toast.success("บันทึกการตั้งค่าแนะนำเรียบร้อย!");
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to save preferences",
      );
    } finally {
      setSavingRecPrefs(false);
    }
  };

  const saveNotifications = async () => {
    toast.success("บันทึกการตั้งค่าแจ้งเตือนเรียบร้อย!");
  };

  const tabs = [
    { id: "account" as const, label: "บัญชี", labelEn: "Account", icon: User },
    {
      id: "preferences" as const,
      label: "ความชอบ",
      labelEn: "Preferences",
      icon: Heart,
    },
    {
      id: "notifications" as const,
      label: "แจ้งเตือน",
      labelEn: "Notifications",
      icon: Bell,
    },
  ];

  const STATS = [
    { label: "Trips", value: userStats?.trips || 0, icon: MapPin, color: "#10b981" },
    { label: "Places", value: userStats?.places || 0, icon: Compass, color: "#3b82f6" },
    { label: "Saved", value: userStats?.saved || 0, icon: Heart, color: "#ef4444" },
  ];

  if (!user) {
    return (
      <div className="p-8 text-center">Please log in to view your profile.</div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#f8f9fa]">
      {/* Immersive Hero Section */}
      <div className="relative h-[320px] overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImage} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0f1923]/70 via-[#0f1923]/50 to-[#0f1923]/90" />
        </div>

        <HeroParticles />

        {/* Thai Pattern Border */}
        <div className="absolute bottom-0 left-0 right-0 h-8">
          <svg
            viewBox="0 0 1200 32"
            className="w-full h-full"
            preserveAspectRatio="none"
          >
            <path
              d="M0,32 L0,24 Q30,0 60,24 Q90,32 120,24 Q150,0 180,24 Q210,32 240,24 Q270,0 300,24 Q330,32 360,24 Q390,0 420,24 Q450,32 480,24 Q510,0 540,24 Q570,32 600,24 Q630,0 660,24 Q690,32 720,24 Q750,0 780,24 Q810,32 840,24 Q870,0 900,24 Q930,32 960,24 Q990,0 1020,24 Q1050,32 1080,24 Q1110,0 1140,24 Q1170,32 1200,24 L1200,32Z"
              fill="#f8f9fa"
            />
          </svg>
        </div>

        {/* Profile Info Overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.2,
              type: "spring",
              stiffness: 200,
              damping: 20,
            }}
            className="flex flex-col items-center text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                delay: 0.3,
                type: "spring",
                stiffness: 300,
                damping: 20,
              }}
              className="relative mb-4"
            >
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white shadow-xl shadow-emerald-500/30 ring-4 ring-white/20 overflow-hidden">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.firstName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span style={{ fontSize: 36, fontWeight: 700 }}>
                    {user.firstName?.charAt(0)}
                  </span>
                )}
              </div>
              <motion.div
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.6, type: "spring" }}
                className="absolute -bottom-1 -right-1 bg-gradient-to-r from-amber-400 to-yellow-500 text-white rounded-full px-2.5 py-0.5 flex items-center gap-1 shadow-lg"
                style={{ fontSize: 10, fontWeight: 600 }}
              >
                <Award className="w-3 h-3" />
                Gold Explorer
              </motion.div>
            </motion.div>

            <h1
              className="text-white mb-1"
              style={{ fontSize: 24, fontWeight: 700 }}
            >
              {user.firstName} {user.lastName}
            </h1>
            <p
              className="text-white/50 flex items-center gap-1.5"
              style={{ fontSize: 14 }}
            >
              <Mail className="w-3.5 h-3.5" />
              {user.email}
            </p>

            {/* Stats */}
            <div className="flex items-center gap-6 mt-5">
              {STATS.map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className="text-center"
                >
                  <div
                    className="text-white"
                    style={{ fontSize: 22, fontWeight: 700 }}
                  >
                    <AnimatedCounter value={s.value} />
                  </div>
                  <p className="text-white/40" style={{ fontSize: 12 }}>
                    {s.label}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 -mt-4 pb-12">
        {/* Tab Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-1.5 flex gap-1 mb-8"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 relative flex items-center justify-center gap-2 py-3 rounded-xl transition-all ${
                  isActive
                    ? "text-white"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeProfileTab"
                    className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl shadow-md shadow-emerald-500/20"
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  />
                )}
                <div className="relative z-10 flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  <span style={{ fontSize: 14, fontWeight: 500 }}>
                    {tab.label}
                  </span>
                  <span
                    className="hidden sm:inline"
                    style={{ fontSize: 11, opacity: 0.7 }}
                  >
                    {tab.labelEn}
                  </span>
                </div>
              </button>
            );
          })}
        </motion.div>

        {/* Account Tab */}
        <AnimatePresence mode="wait">
          {activeTab === "account" && (
            <motion.div
              key="account"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="space-y-6"
            >
              {/* Account Info Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 pt-6 pb-4 border-b border-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                      <User className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h2
                        style={{
                          fontSize: 18,
                          fontWeight: 600,
                          color: "#0f1923",
                        }}
                      >
                        ข้อมูลบัญชี
                      </h2>
                      <p className="text-gray-400" style={{ fontSize: 13 }}>
                        Account Information
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label
                        className="text-gray-500 mb-1.5 block"
                        style={{ fontSize: 12, fontWeight: 500 }}
                      >
                        ชื่อ (First Name)
                      </label>
                      <div
                        className="h-11 rounded-xl border border-gray-100 bg-gray-50 px-4 flex items-center text-gray-700"
                        style={{ fontSize: 14 }}
                      >
                        {user.firstName}
                      </div>
                    </div>
                    <div>
                      <label
                        className="text-gray-500 mb-1.5 block"
                        style={{ fontSize: 12, fontWeight: 500 }}
                      >
                        นามสกุล (Last Name)
                      </label>
                      <div
                        className="h-11 rounded-xl border border-gray-100 bg-gray-50 px-4 flex items-center text-gray-700"
                        style={{ fontSize: 14 }}
                      >
                        {user.lastName}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label
                      className="text-gray-500 mb-1.5 block"
                      style={{ fontSize: 12, fontWeight: 500 }}
                    >
                      อีเมล (Email)
                    </label>
                    <div
                      className="h-11 rounded-xl border border-gray-100 bg-gray-50 px-4 flex items-center text-gray-700 gap-2"
                      style={{ fontSize: 14 }}
                    >
                      <Mail className="w-4 h-4 text-gray-400" />
                      {user.email}
                    </div>
                  </div>
                </div>
              </div>

              {/* Security Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 pt-6 pb-4 border-b border-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <h2
                        style={{
                          fontSize: 18,
                          fontWeight: 600,
                          color: "#0f1923",
                        }}
                      >
                        ความปลอดภัย
                      </h2>
                      <p className="text-gray-400" style={{ fontSize: 13 }}>
                        Security Settings
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-gray-50 to-gray-50/50 border border-gray-100 group hover:border-emerald-200 hover:from-emerald-50/50 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center group-hover:border-emerald-200 transition-colors">
                        <Key className="w-4 h-4 text-gray-400 group-hover:text-emerald-500 transition-colors" />
                      </div>
                      <div>
                        <p
                          style={{
                            fontSize: 14,
                            fontWeight: 500,
                            color: "#0f1923",
                          }}
                        >
                          รหัสผ่าน
                        </p>
                        <p className="text-gray-400" style={{ fontSize: 12 }}>
                          เปลี่ยนรหัสผ่านเพื่อความปลอดภัย
                        </p>
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setPasswordDialogOpen(true)}
                      className="px-4 py-2 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-colors flex items-center gap-2 shadow-sm"
                      style={{ fontSize: 13, fontWeight: 500 }}
                    >
                      <Key className="w-3.5 h-3.5" />
                      เปลี่ยนรหัสผ่าน
                    </motion.button>
                  </div>
                </div>
              </div>

              {/* Activity Stats */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                  <h2
                    style={{ fontSize: 18, fontWeight: 600, color: "#0f1923" }}
                  >
                    สถิติการท่องเที่ยว
                  </h2>
                  <span className="text-gray-400" style={{ fontSize: 13 }}>
                    Travel Stats
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {STATS.map((s, i) => (
                    <StatCard key={s.label} {...s} delay={0.1 + i * 0.1} />
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Preferences Tab */}
          {activeTab === "preferences" && (
            <motion.div
              key="preferences"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="space-y-6"
            >
              {/* Travel Preferences */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 pt-6 pb-4 border-b border-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                        <Heart className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <h2
                          style={{
                            fontSize: 18,
                            fontWeight: 600,
                            color: "#0f1923",
                          }}
                        >
                          ความชอบในการเดินทาง
                        </h2>
                        <p className="text-gray-400" style={{ fontSize: 13 }}>
                          Travel Preferences
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100">
                      <div className="flex">
                        {[...Array(MAX_SELECTION)].map((_, i) => (
                          <div
                            key={i}
                            className="w-2 h-2 rounded-full mx-0.5 transition-all"
                            style={{
                              background:
                                i < selectedPreferenceIds.length
                                  ? "#10b981"
                                  : "#e5e7eb",
                            }}
                          />
                        ))}
                      </div>
                      <span
                        style={{
                          fontSize: 12,
                          color: "#059669",
                          fontWeight: 500,
                        }}
                      >
                        {selectedPreferenceIds.length}/{MAX_SELECTION}
                      </span>
                    </div>
                  </div>
                  <p
                    className="text-gray-400 mt-2 ml-[52px]"
                    style={{ fontSize: 13 }}
                  >
                    เลือกสูงสุด {MAX_SELECTION}{" "}
                    หมวดหมู่เพื่อปรับแต่งคำแนะนำของคุณ
                  </p>
                </div>

                <div className="p-6">
                  {showPreferenceDataMissing && (
                    <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3.5">
                      <p
                        className="text-amber-800"
                        style={{ fontSize: 12, fontWeight: 600 }}
                      >
                        ยังไม่มีข้อมูลหมวดหมู่ความชอบในระบบ
                      </p>
                      <p
                        className="mt-1 text-amber-700"
                        style={{ fontSize: 12 }}
                      >
                        กรุณาลองใหม่อีกครั้ง หรือแจ้งผู้ดูแลระบบให้เพิ่มข้อมูล
                        travel preferences
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {displayPreferences.map((pref, i) => (
                      <PreferenceChip
                        key={pref.id}
                        pref={pref}
                        selected={selectedPreferenceIds.includes(pref.id)}
                        onClick={() => togglePreference(pref.id)}
                        delay={i * 0.05}
                      />
                    ))}
                  </div>

                  <div className="mt-5 rounded-xl border border-emerald-100 bg-emerald-50/70 p-3.5">
                    <p
                      className="text-emerald-700"
                      style={{ fontSize: 12, fontWeight: 600 }}
                    >
                      หมวดหมู่คำแนะนำที่จะใช้ (Preview)
                    </p>
                    {previewCategoryLabels.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {previewCategoryLabels.map((label) => (
                          <span
                            key={label}
                            className="px-2.5 py-1 rounded-full border border-emerald-200 bg-white text-emerald-700"
                            style={{ fontSize: 12, fontWeight: 500 }}
                          >
                            {label}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p
                        className="mt-2 text-gray-500"
                        style={{ fontSize: 12 }}
                      >
                        ยังไม่ได้เลือกความชอบสำหรับสร้างหมวดหมู่แนะนำ
                      </p>
                    )}
                    <p className="mt-2 text-gray-500" style={{ fontSize: 11 }}>
                      เมื่อกดบันทึก ระบบจะอัปเดตทั้ง Travel Preferences และ
                      Recommendation Preferences
                    </p>
                  </div>
                </div>
              </div>

              {/* Preferred Regions */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 pt-6 pb-4 border-b border-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                      <Globe className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h2
                        style={{
                          fontSize: 18,
                          fontWeight: 600,
                          color: "#0f1923",
                        }}
                      >
                        ภูมิภาคที่สนใจ
                      </h2>
                      <p className="text-gray-400" style={{ fontSize: 13 }}>
                        Preferred Regions
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {REGIONS.map((region) => (
                      <RegionToggle
                        key={region.value}
                        region={region}
                        selected={selectedRegions.includes(region.value)}
                        onClick={() => toggleRegion(region.value)}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={savePreferences}
                  disabled={savingPrefs || !canEditPreferences}
                  className="px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-shadow disabled:opacity-60 flex items-center gap-2"
                  style={{ fontSize: 14, fontWeight: 500 }}
                >
                  {savingPrefs ? (
                    <motion.div
                      className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  {savingPrefs ? "กำลังบันทึก..." : "บันทึกความชอบ"}
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Notifications Tab */}
          {activeTab === "notifications" && (
            <motion.div
              key="notifications"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 pt-6 pb-4 border-b border-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                      <Bell className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <h2
                        style={{
                          fontSize: 18,
                          fontWeight: 600,
                          color: "#0f1923",
                        }}
                      >
                        การแจ้งเตือน
                      </h2>
                      <p className="text-gray-400" style={{ fontSize: 13 }}>
                        Notification Preferences
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-3">
                  {NOTIFICATION_SETTINGS.map((setting, i) => (
                    <motion.div
                      key={setting.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-emerald-100 hover:bg-emerald-50/30 transition-all group"
                    >
                      <div>
                        <p
                          style={{
                            fontSize: 14,
                            fontWeight: 500,
                            color: "#0f1923",
                          }}
                        >
                          {setting.label}
                        </p>
                        <p className="text-gray-400" style={{ fontSize: 12 }}>
                          {setting.desc}
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          setNotifications((prev) => ({
                            ...prev,
                            [setting.id]: !prev[setting.id],
                          }))
                        }
                        className={`relative w-12 h-7 rounded-full transition-all ${
                          notifications[setting.id]
                            ? "bg-emerald-500"
                            : "bg-gray-200"
                        }`}
                      >
                        <motion.div
                          animate={{ x: notifications[setting.id] ? 22 : 3 }}
                          transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 25,
                          }}
                          className="absolute top-[3px] w-[22px] h-[22px] rounded-full bg-white shadow-sm"
                        />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={saveNotifications}
                  className="px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-shadow flex items-center gap-2"
                  style={{ fontSize: 14, fontWeight: 500 }}
                >
                  <Check className="w-4 h-4" />
                  บันทึกการตั้งค่า
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Change Password Dialog */}
      <ChangePasswordDialog
        open={passwordDialogOpen}
        onClose={() => setPasswordDialogOpen(false)}
      />
    </div>
  );
}
