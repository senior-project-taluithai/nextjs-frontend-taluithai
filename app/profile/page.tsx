"use client"

import React, { useState } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
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

// Mock Travel Preferences
const travelPreferencesList = [
    "Beach", "Mountain", "City", "Historical", "Foodie",
    "Adventure", "Relaxation", "Luxury", "Budget", "Family Friendly",
    "Nightlife", "Nature", "Culture", "Shopping", "Road Trip",
    "Camping", "Resort", "Solo Travel", "Cruises", "Ecotourism"
];

function ChangePasswordDialog() {
    const [isLoading, setIsLoading] = useState(false);
    const [open, setOpen] = useState(false);

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
        setIsLoading(true);
        try {
            // In a real app, you'd call an API here.
            // For now, we'll simulate a delay and success.
            // await authService.changePassword(data);
            await new Promise(resolve => setTimeout(resolve, 1000));
            toast.success('Password changed successfully');
            setOpen(false);
            reset();
        } catch (err: any) {
            toast.error('Failed to change password');
        } finally {
            setIsLoading(false);
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
    const [selectedPreferences, setSelectedPreferences] = useState<string[]>([]);
    const MAX_SELECTION = 5;

    const togglePreference = (pref: string) => {
        if (selectedPreferences.includes(pref)) {
            setSelectedPreferences(selectedPreferences.filter(p => p !== pref));
        } else {
            if (selectedPreferences.length < MAX_SELECTION) {
                setSelectedPreferences([...selectedPreferences, pref]);
            } else {
                toast.warning(`You can only select up to ${MAX_SELECTION} preferences.`);
            }
        }
    };

    const savePreferences = async () => {
        // Simulate API call
        toast.success('Preferences saved successfully!');
    }

    if (!user) {
        return <div className="p-8">Please log in to view your profile.</div>
    }

    return (
        <div className="container mx-auto py-10 max-w-4xl">
            <h1 className="text-3xl font-bold mb-6">Profile Settings</h1>

            <Tabs defaultValue="account" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-8">
                    <TabsTrigger value="account">Account</TabsTrigger>
                    <TabsTrigger value="preferences">Travel Preferences</TabsTrigger>
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
                            <div className="flex flex-wrap gap-2 mb-6">
                                {travelPreferencesList.map((pref) => (
                                    <Badge
                                        key={pref}
                                        variant={selectedPreferences.includes(pref) ? "default" : "outline"}
                                        className="cursor-pointer text-sm py-1 px-3 hover:bg-primary/90 hover:text-primary-foreground transition-colors"
                                        onClick={() => togglePreference(pref)}
                                    >
                                        {pref}
                                    </Badge>
                                ))}
                            </div>
                            <div className="text-sm text-muted-foreground">
                                Selected: {selectedPreferences.length} / {MAX_SELECTION}
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button onClick={savePreferences} disabled={selectedPreferences.length === 0}>
                                Save Preferences
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
