"use client"

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useAllTravelPreferences, useUserPreferences, useUpdateUserPreferencesMutation, useRecommendationPreferences, useUpdateRecommendationPreferencesMutation } from '@/hooks/api/usePreferences';
import { useCategories } from '@/hooks/api/useCategories';
import { useChangePasswordMutation } from '@/hooks/api/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { changePasswordSchema, ChangePasswordFormValues } from '@/lib/validations/auth';
import { toast } from 'sonner';

// ── Constants ────────────────────────────────────────────────────────────────
const REGIONS = [
    { value: 'North', label: 'ภาคเหนือ', labelEn: 'North' },
    { value: 'Northeast', label: 'ภาคอีสาน', labelEn: 'Northeast' },
    { value: 'Central', label: 'ภาคกลาง', labelEn: 'Central' },
    { value: 'East', label: 'ภาคตะวันออก', labelEn: 'East' },
    { value: 'West', label: 'ภาคตะวันตก', labelEn: 'West' },
    { value: 'South', label: 'ภาคใต้', labelEn: 'South' },
];

// ── Change Password Dialog ───────────────────────────────────────────────────

function ChangePasswordDialog() {
    const [open, setOpen] = useState(false);
    const changePasswordMutation = useChangePasswordMutation();
    const isLoading = changePasswordMutation.isPending;

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<ChangePasswordFormValues>({
        resolver: zodResolver(changePasswordSchema),
        defaultValues: {
            currentPassword: '',
            newPassword: '',
            confirmNewPassword: ''
        }
    });

    const onSubmit = async (data: ChangePasswordFormValues) => {
        try {
            await changePasswordMutation.mutateAsync({
                oldPassword: data.currentPassword,
                newPassword: data.newPassword,
            });
            toast.success('Password changed successfully');
            setOpen(false);
            reset();
        } catch (err: any) {
            // Basic error handling - display message from backend if available
            toast.error(err.response?.data?.message || 'Failed to change password');
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">Change Password</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Change Password</DialogTitle>
                    <DialogDescription>
                        Make changes to your password here. Click save when you're done.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="currentPassword">Current Password</Label>
                        <Input
                            id="currentPassword"
                            type="password"
                            {...register("currentPassword")}
                        />
                        {errors.currentPassword && <p className="text-red-500 text-xs">{errors.currentPassword.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="newPassword">New Password</Label>
                        <div className="text-xs text-muted-foreground mb-1">
                            Must be at least 12 characters, include uppercase, lowercase, number, and symbol.
                        </div>
                        <Input
                            id="newPassword"
                            type="password"
                            {...register("newPassword")}
                        />
                        {errors.newPassword && <p className="text-red-500 text-xs">{errors.newPassword.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
                        <Input
                            id="confirmNewPassword"
                            type="password"
                            {...register("confirmNewPassword")}
                        />
                        {errors.confirmNewPassword && <p className="text-red-500 text-xs">{errors.confirmNewPassword.message}</p>}
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? 'Saving...' : 'Save changes'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

export default function ProfilePage() {
    const { user } = useAuth();

    // Travel preferences (theme-based)
    const { data: allPreferences = [], isLoading: loadingPreferences } = useAllTravelPreferences();
    const { data: userPreferences = [], isLoading: loadingUserPreferences } = useUserPreferences();
    const updatePreferencesMutation = useUpdateUserPreferencesMutation();

    // Recommendation preferences (categories & regions)
    const { data: categories = [], isLoading: loadingCategories } = useCategories();
    const { data: recPrefs, isLoading: loadingRecPrefs } = useRecommendationPreferences();
    const updateRecPrefsMutation = useUpdateRecommendationPreferencesMutation();

    const [selectedPreferenceIds, setSelectedPreferenceIds] = useState<string[]>([]);
    const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
    const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
    const MAX_SELECTION = 5;

    // Sync travel preferences
    useEffect(() => {
        if (userPreferences.length > 0) {
            setSelectedPreferenceIds(userPreferences.map(p => p.id));
        }
    }, [userPreferences]);

    // Sync recommendation preferences
    useEffect(() => {
        if (recPrefs) {
            setSelectedCategoryIds(recPrefs.preferredCategoryIds ?? []);
            setSelectedRegions(recPrefs.preferredRegions ?? []);
        }
    }, [recPrefs]);

    const togglePreference = (prefId: string) => {
        if (selectedPreferenceIds.includes(prefId)) {
            setSelectedPreferenceIds(selectedPreferenceIds.filter(id => id !== prefId));
        } else {
            if (selectedPreferenceIds.length < MAX_SELECTION) {
                setSelectedPreferenceIds([...selectedPreferenceIds, prefId]);
            } else {
                toast.warning(`You can only select up to ${MAX_SELECTION} preferences.`);
            }
        }
    };

    const toggleCategory = (catId: number) => {
        if (selectedCategoryIds.includes(catId)) {
            setSelectedCategoryIds(selectedCategoryIds.filter(id => id !== catId));
        } else {
            setSelectedCategoryIds([...selectedCategoryIds, catId]);
        }
    };

    const toggleRegion = (region: string) => {
        if (selectedRegions.includes(region)) {
            setSelectedRegions(selectedRegions.filter(r => r !== region));
        } else {
            setSelectedRegions([...selectedRegions, region]);
        }
    };

    const savePreferences = async () => {
        try {
            await updatePreferencesMutation.mutateAsync({ preferenceIds: selectedPreferenceIds });
            toast.success('Preferences saved successfully!');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to save preferences');
        }
    }

    const saveRecommendationPreferences = async () => {
        try {
            await updateRecPrefsMutation.mutateAsync({
                preferredCategoryIds: selectedCategoryIds,
                preferredRegions: selectedRegions,
            });
            toast.success('Recommendation preferences saved!');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to save recommendation preferences');
        }
    };

    const savingPreferences = updatePreferencesMutation.isPending;
    const savingRecPrefs = updateRecPrefsMutation.isPending;
    const isLoading = loadingPreferences || loadingUserPreferences;
    const isRecLoading = loadingCategories || loadingRecPrefs;

    if (!user) {
        return <div className="p-8">Please log in to view your profile.</div>
    }

    return (
        <div className="container mx-auto py-10 max-w-4xl">
            <h1 className="text-3xl font-bold mb-6">Profile Settings</h1>

            <Tabs defaultValue="account" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-8">
                    <TabsTrigger value="account">Account</TabsTrigger>
                    <TabsTrigger value="preferences">Travel Preferences</TabsTrigger>
                    <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
                </TabsList>

                <TabsContent value="account">
                    <Card>
                        <CardHeader>
                            <CardTitle>Account Information</CardTitle>
                            <CardDescription>
                                View your account details and manage your password.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>First Name</Label>
                                    <Input value={user.firstName} disabled className="bg-muted" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Last Name</Label>
                                    <Input value={user.lastName} disabled className="bg-muted" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input value={user.email} disabled className="bg-muted" />
                            </div>

                            <div className="pt-4 border-t">
                                <h3 className="text-lg font-medium mb-4">Security</h3>
                                <div className="flex items-center justify-between p-4 border rounded-lg">
                                    <div>
                                        <p className="font-medium">Password</p>
                                        <p className="text-sm text-muted-foreground">Change your password to keep your account secure.</p>
                                    </div>
                                    <ChangePasswordDialog />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="preferences">
                    <Card>
                        <CardHeader>
                            <CardTitle>Travel Preferences</CardTitle>
                            <CardDescription>
                                Select up to 5 travel preferences to help us personalize your experience.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div>Loading preferences...</div>
                            ) : (
                                <>
                                    <div className="flex flex-wrap gap-2 mb-6">
                                        {allPreferences.map((pref) => (
                                            <Badge
                                                key={pref.id}
                                                variant={selectedPreferenceIds.includes(pref.id) ? "default" : "outline"}
                                                className="cursor-pointer text-sm py-1 px-3 hover:bg-primary/90 hover:text-primary-foreground transition-colors"
                                                onClick={() => togglePreference(pref.id)}
                                            >
                                                {pref.name}
                                            </Badge>
                                        ))}
                                        {allPreferences.length === 0 && <p className="text-muted-foreground">No preferences available.</p>}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        Selected: {selectedPreferenceIds.length} / {MAX_SELECTION}
                                    </div>
                                </>
                            )}
                        </CardContent>
                        <CardFooter>
                            <Button onClick={savePreferences} disabled={savingPreferences || isLoading}>
                                {savingPreferences ? 'Saving...' : 'Save Preferences'}
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                <TabsContent value="recommendations">
                    <div className="space-y-6">
                        {/* Preferred Categories */}
                        <Card>
                            <CardHeader>
                                <CardTitle>หมวดหมู่ที่สนใจ</CardTitle>
                                <CardDescription>
                                    เลือกหมวดหมู่สถานที่ที่คุณสนใจ เพื่อให้ระบบแนะนำสถานที่ได้ตรงใจมากขึ้น
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {loadingCategories ? (
                                    <div>Loading categories...</div>
                                ) : (
                                    <>
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {categories.map((cat) => (
                                                <Badge
                                                    key={cat.id}
                                                    variant={selectedCategoryIds.includes(cat.id) ? "default" : "outline"}
                                                    className="cursor-pointer text-sm py-2 px-4 hover:bg-primary/90 hover:text-primary-foreground transition-colors"
                                                    onClick={() => toggleCategory(cat.id)}
                                                >
                                                    {cat.name}
                                                    <span className="ml-1 text-xs opacity-70">({cat.nameEn})</span>
                                                </Badge>
                                            ))}
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            เลือกแล้ว: {selectedCategoryIds.length} หมวดหมู่
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        {/* Preferred Regions */}
                        <Card>
                            <CardHeader>
                                <CardTitle>ภูมิภาคที่สนใจ</CardTitle>
                                <CardDescription>
                                    เลือกภูมิภาคที่คุณอยากเที่ยว เพื่อให้ระบบแนะนำสถานที่ในพื้นที่ที่ชอบ
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {REGIONS.map((region) => (
                                        <Badge
                                            key={region.value}
                                            variant={selectedRegions.includes(region.value) ? "default" : "outline"}
                                            className="cursor-pointer text-sm py-2 px-4 hover:bg-primary/90 hover:text-primary-foreground transition-colors"
                                            onClick={() => toggleRegion(region.value)}
                                        >
                                            {region.label}
                                            <span className="ml-1 text-xs opacity-70">({region.labelEn})</span>
                                        </Badge>
                                    ))}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    เลือกแล้ว: {selectedRegions.length} ภูมิภาค
                                </div>
                            </CardContent>
                        </Card>

                        {/* Save button */}
                        <div className="flex justify-end">
                            <Button
                                onClick={saveRecommendationPreferences}
                                disabled={savingRecPrefs || isRecLoading}
                                size="lg"
                            >
                                {savingRecPrefs ? 'Saving...' : 'บันทึกการตั้งค่า'}
                            </Button>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
