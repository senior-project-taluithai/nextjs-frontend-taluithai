import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUpdateTrip } from "@/hooks/api/useTrips";
import { toast } from "sonner";
import { Wallet } from "lucide-react";

export function EditBudgetDialog({
  open,
  onOpenChange,
  trip,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trip: any;
}) {
  const [categories, setCategories] = useState<any[]>([]);
  const [dailyBudgets, setDailyBudgets] = useState<any[]>([]);
  const [newCatName, setNewCatName] = useState("");
  
  const updateTripMutation = useUpdateTrip();

  useEffect(() => {
    if (open && trip?.budget) {
      setCategories(trip.budget.categories ? [...trip.budget.categories] : []);
      setDailyBudgets(trip.budget.dailyBudgets ? [...trip.budget.dailyBudgets] : []);
    } else if (open && !trip?.budget) {
      setCategories([]);
      setDailyBudgets([]);
    }
  }, [open, trip]);

  const total = categories.reduce((acc, cat) => acc + (Number(cat.allocated) || 0), 0);
  const avgDaily = dailyBudgets.length > 0 
    ? Math.round(total / dailyBudgets.length) 
    : 0;

  const handleSave = () => {
    // If daily budgets exist, calculate proportional distribution if total changed
    // Wait, backend or frontend should manage daily budgets. If total changes,
    // let's distribute equally or proportionally across daily budgets.
    const updatedDailyBudgets = dailyBudgets.map(db => ({
       ...db,
       allocated: dailyBudgets.length > 0 ? Math.round(total / dailyBudgets.length) : db.allocated
    }));

    const newBudget = {
      total,
      categories,
      dailyBudgets: updatedDailyBudgets,
    };

    updateTripMutation.mutate(
      { id: trip.id, data: { budget: newBudget } },
      {
        onSuccess: () => {
          toast.success("Budget updated successfully");
          onOpenChange(false);
        },
        onError: (error: any) => {
          toast.error(`Failed to update budget: ${error.message}`);
        },
      }
    );
  };

  const handleCategoryChange = (index: number, value: number) => {
    const newCats = [...categories];
    newCats[index].allocated = value;
    setCategories(newCats);
  };

  const handleRemoveCategory = (index: number) => {
    const newCats = [...categories];
    newCats.splice(index, 1);
    setCategories(newCats);
  };

  const handleAddCategory = () => {
    if (!newCatName.trim()) return;
    const colors = ["#8b5cf6", "#f43f5e", "#10b981", "#f59e0b", "#3b82f6", "#06b6d4"];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    
    setCategories([
      ...categories,
      {
        id: `custom-${Date.now()}`,
        name: newCatName.trim(),
        color: randomColor,
        allocated: 0,
        spent: 0
      }
    ]);
    setNewCatName("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
             <Wallet className="w-5 h-5 text-emerald-500" />
             Edit Budget
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4 max-h-[70vh] overflow-y-auto pr-2">
          {/* Total Summary */}
          <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
            <label className="text-sm font-medium text-emerald-800">Total Budget (Auto-calculated)</label>
            <div className="text-3xl font-bold text-emerald-600 mt-1">
              ฿{total.toLocaleString()}
            </div>
            {dailyBudgets.length > 0 && (
               <p className="text-xs text-emerald-600/80 mt-1">Average ฿{avgDaily.toLocaleString()} / day</p>
            )}
          </div>

          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
               <h4 className="text-sm font-bold text-gray-900">Categories Breakdown</h4>
            </div>

             {categories.length === 0 ? (
                <p className="text-sm text-gray-500 italic">No categories available.</p>
             ) : (
                <div className="space-y-3">
                  {categories.map((cat, idx) => (
                    <div key={cat.id} className="flex items-center gap-3">
                        <div className="flex items-center gap-2 flex-1">
                          <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }}></span>
                          <span className="text-sm font-medium text-gray-700 flex-1 truncate">{cat.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                              type="number"
                              min="0"
                              value={cat.allocated || 0}
                              onChange={(e) => handleCategoryChange(idx, Number(e.target.value))}
                              className="w-28 text-right h-9"
                          />
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-9 w-9 text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => handleRemoveCategory(idx)}
                          >
                            ×
                          </Button>
                        </div>
                    </div>
                  ))}
                </div>
            )}
            
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
              <Input
                placeholder="New category..."
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="h-9"
                onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
              />
              <Button onClick={handleAddCategory} variant="secondary" className="h-9 whitespace-nowrap">
                Add
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={updateTripMutation.isPending} className="bg-emerald-500 hover:bg-emerald-600 text-white">
             {updateTripMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
