"use client"

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { loginSchema, LoginFormValues } from '@/lib/validations/auth';
import { useLoginMutation } from '@/hooks/api/useAuth';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, UserCircle } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const loginMutation = useLoginMutation();
    const isLoading = loginMutation.isPending;

    const {
        register: formRegister,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: '',
            password: ''
        }
    });

    const onSubmit = async (data: LoginFormValues) => {
        try {
            await loginMutation.mutateAsync(data);
            toast.success('Logged in successfully');
            router.push('/');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Invalid email or password');
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#f8f9fa] relative overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-emerald-100/50 rounded-full blur-3xl opacity-50" />
            <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-teal-100/50 rounded-full blur-3xl opacity-50" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-[440px] z-10"
            >
                <Card className="border-0 shadow-2xl rounded-[2.5rem] overflow-hidden bg-white/100">
                    <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-6 sm:p-10 text-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-black/5" />
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="bg-white/20 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md border border-white/30"
                        >
                            <UserCircle className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                        </motion.div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 tracking-tight">Welcome Back</h1>
                        <p className="text-emerald-50/80 text-xs sm:text-sm font-medium">Log in to continue your journey</p>
                    </div>

                    <CardContent className="p-6 sm:p-10 pt-6 sm:pt-8">
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1 text-left block">Email Address</label>
                                <div className={`flex items-center gap-3 bg-gray-50 border transition-all duration-200 rounded-2xl px-4 py-3.5 ${errors.email ? 'border-red-300 ring-2 ring-red-50' : 'border-gray-100 focus-within:border-emerald-400 focus-within:ring-4 focus-within:ring-emerald-500/10'}`}>
                                    <Mail className={`w-5 h-5 ${errors.email ? 'text-red-400' : 'text-gray-400'}`} />
                                    <input
                                        type="email"
                                        placeholder="your@email.com"
                                        className="flex-1 bg-transparent outline-none text-sm text-gray-700 placeholder-gray-400"
                                        {...formRegister("email")}
                                    />
                                </div>
                                {errors.email && <p className="text-red-500 text-[10px] font-bold ml-1">{errors.email.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between ml-1">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest text-left">Password</label>
                                    <Link href="/auth/forgot-password" className="text-[11px] text-emerald-600 hover:text-emerald-700 font-bold transition-colors">
                                        Forgot?
                                    </Link>
                                </div>
                                <div className={`flex items-center gap-3 bg-gray-50 border transition-all duration-200 rounded-2xl px-4 py-3.5 ${errors.password ? 'border-red-300 ring-2 ring-red-50' : 'border-gray-100 focus-within:border-emerald-400 focus-within:ring-4 focus-within:ring-emerald-500/10'}`}>
                                    <Lock className={`w-5 h-5 ${errors.password ? 'text-red-400' : 'text-gray-400'}`} />
                                    <input
                                        type="password"
                                        placeholder="••••••••"
                                        className="flex-1 bg-transparent outline-none text-sm text-gray-700 placeholder-gray-400"
                                        {...formRegister("password")}
                                    />
                                </div>
                                {errors.password && <p className="text-red-500 text-[10px] font-bold ml-1">{errors.password.message}</p>}
                            </div>

                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-2xl py-6 font-bold text-base shadow-lg shadow-emerald-200 transition-all active:scale-[0.98] group"
                            >
                                {isLoading ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>Logging in...</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center gap-2">
                                        <span>Login</span>
                                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                )}
                            </Button>

                            <div className="pt-2 text-center border-t border-gray-50 mt-4 pt-6">
                                <p className="text-sm text-gray-500">
                                    New here?{' '}
                                    <Link href="/auth/register" className="text-emerald-600 font-bold hover:text-emerald-700 transition-colors">
                                        Create an account
                                    </Link>
                                </p>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
