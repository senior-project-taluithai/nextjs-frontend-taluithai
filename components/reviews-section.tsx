"use client";

import { useState } from "react";
import { Review } from "@/lib/mock-data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StarRating } from "@/components/ui/star-rating";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, MessageSquare } from "lucide-react";

interface ReviewsSectionProps {
    reviews: Review[];
    onAddReview?: (review: Omit<Review, "review_id" | "date">) => void;
}

export function ReviewsSection({ reviews: initialReviews }: ReviewsSectionProps) {
    // Local state to simulate adding reviews immediately
    const [reviews, setReviews] = useState<Review[]>(initialReviews);
    const [newRating, setNewRating] = useState(0);
    const [comment, setComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newRating === 0) return;

        setIsSubmitting(true);

        // Simulate API delay
        setTimeout(() => {
            const newReview: Review = {
                review_id: Math.random(),
                user_name: "You (Guest)", // Mock user
                rating: newRating,
                comment: comment,
                date: new Date().toISOString().split('T')[0]
            };

            setReviews([newReview, ...reviews]);
            setNewRating(0);
            setComment("");
            setIsSubmitting(false);
        }, 600);
    };

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-primary" />
                        Reviews & Ratings ({reviews.length})
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-8">
                    {/* Add Review Form */}
                    <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-xl space-y-4">
                        <h4 className="font-semibold text-lg">Write a Review</h4>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Your Rating</label>
                            <StarRating
                                rating={newRating}
                                onRatingChange={setNewRating}
                                size={6}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Your Comment</label>
                            <Textarea
                                placeholder="Share your experience..."
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                className="min-h-[100px]"
                            />
                        </div>
                        <Button
                            onClick={handleSubmit}
                            disabled={newRating === 0 || !comment.trim() || isSubmitting}
                        >
                            {isSubmitting ? "Posting..." : "Post Review"}
                        </Button>
                    </div>

                    {/* Reviews List */}
                    <div className="space-y-6">
                        {reviews.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                No reviews yet. Be the first to share your experience!
                            </div>
                        ) : (
                            reviews.map((review) => (
                                <div key={review.review_id} className="flex gap-4 p-4 border rounded-lg bg-card hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                                    <Avatar>
                                        <AvatarImage src={review.avatar_url} alt={review.user_name} />
                                        <AvatarFallback><User className="w-4 h-4" /></AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-semibold text-sm">{review.user_name}</p>
                                                <p className="text-xs text-muted-foreground">{review.date}</p>
                                            </div>
                                            <StarRating rating={review.rating} readonly size={4} />
                                        </div>
                                        <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">{review.comment}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
