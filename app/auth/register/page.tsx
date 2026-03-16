"use client"

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { registerSchema, RegisterFormValues } from '@/lib/validations/auth';
import { useRegisterMutation } from '@/hooks/api/useAuth';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, UserPlus } from 'lucide-react';

export default function RegisterPage() {
    const router = useRouter();
    const registerMutation = useRegisterMutation();
    const isLoading = registerMutation.isPending;

    const {
        register: formRegister,
        handleSubmit,
        formState: { errors },
    } = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            firstName: '',
            lastName: '',
            email: '',
            password: '',
            confirmPassword: ''
        }
    });

    const onSubmit = async (data: RegisterFormValues) => {
        try {
            // Exclude confirmPassword from the API call
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { confirmPassword, ...registerData } = data;
            await registerMutation.mutateAsync(registerData);
            toast.success('Account created successfully!');
            router.push('/');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Registration failed');
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#f8f9fa] relative overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-emerald-100/50 rounded-full blur-3xl opacity-50" />
            <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-teal-100/50 rounded-full blur-3xl opacity-50" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-[500px] z-10 my-8"
            >
                <Card className="border-0 shadow-2xl rounded-[2.5rem] overflow-hidden bg-white">
                    <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-8 text-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-black/5" />
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="bg-white/20 w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md border border-white/30"
                        >
                            <UserPlus className="w-8 h-8 text-white" />
                        </motion.div>
                        <h1 className="text-2xl font-bold text-white mb-1 tracking-tight">Create Account</h1>
                        <p className="text-emerald-50/80 text-xs font-medium">Join us and start your adventure</p>
                    </div>

                    <CardContent className="p-8 pb-10">
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1 block text-left">First Name</label>
                                    <div className={`flex items-center gap-3 bg-gray-50 border transition-all duration-200 rounded-2xl px-4 py-3 ${errors.firstName ? 'border-red-300 ring-2 ring-red-50' : 'border-gray-100 focus-within:border-emerald-400 focus-within:ring-4 focus-within:ring-emerald-500/10'}`}>
                                        <User className={`w-4 h-4 ${errors.firstName ? 'text-red-400' : 'text-gray-400'}`} />
                                        <input
                                            placeholder="John"
                                            className="flex-1 bg-transparent outline-none text-xs text-gray-700 placeholder-gray-400"
                                            {...formRegister("firstName")}
                                        />
                                    </div>
                                    {errors.firstName && <p className="text-red-500 text-[10px] font-bold ml-1">{errors.firstName.message}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1 block text-left">Last Name</label>
                                    <div className={`flex items-center gap-3 bg-gray-50 border transition-all duration-200 rounded-2xl px-4 py-3 ${errors.lastName ? 'border-red-300 ring-2 ring-red-50' : 'border-gray-100 focus-within:border-emerald-400 focus-within:ring-4 focus-within:ring-emerald-500/10'}`}>
                                        <User className={`w-4 h-4 ${errors.lastName ? 'text-red-400' : 'text-gray-400'}`} />
                                        <input
                                            placeholder="Doe"
                                            className="flex-1 bg-transparent outline-none text-xs text-gray-700 placeholder-gray-400"
                                            {...formRegister("lastName")}
                                        />
                                    </div>
                                    {errors.lastName && <p className="text-red-500 text-[10px] font-bold ml-1">{errors.lastName.message}</p>}
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1 block text-left">Email Address</label>
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

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1 block text-left">Password</label>
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

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1 block text-left">Confirm Password</label>
                                <div className={`flex items-center gap-3 bg-gray-50 border transition-all duration-200 rounded-2xl px-4 py-3.5 ${errors.confirmPassword ? 'border-red-300 ring-2 ring-red-50' : 'border-gray-100 focus-within:border-emerald-400 focus-within:ring-4 focus-within:ring-emerald-500/10'}`}>
                                    <Lock className={`w-5 h-5 ${errors.confirmPassword ? 'text-red-400' : 'text-gray-400'}`} />
                                    <input
                                        type="password"
                                        placeholder="••••••••"
                                        className="flex-1 bg-transparent outline-none text-sm text-gray-700 placeholder-gray-400"
                                        {...formRegister("confirmPassword")}
                                    />
                                </div>
                                {errors.confirmPassword && <p className="text-red-500 text-[10px] font-bold ml-1">{errors.confirmPassword.message}</p>}
                            </div>

                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-2xl py-6 font-bold text-base shadow-lg shadow-emerald-200 transition-all active:scale-[0.98] group mt-4"
                            >
                                {isLoading ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>Creating account...</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center gap-2">
                                        <span>Register</span>
                                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                )}
                            </Button>

                            <div className="pt-2 text-center border-t border-gray-50 mt-4 pt-6">
                                <p className="text-sm text-gray-500">
                                    Already have an account?{' '}
                                    <Link href="/auth/login" className="text-emerald-600 font-bold hover:text-emerald-700 transition-colors">
                                        Sign in
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
