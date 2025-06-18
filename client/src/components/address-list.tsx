import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Check } from "lucide-react";
import { Address } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface AddressListProps {
  addresses: Address[];
  isLoading: boolean;
}

export default function AddressList({ addresses, isLoading }: AddressListProps) {
  const { toast } = useToast();

  const deleteAddressMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/addresses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/addresses'] });
      toast({
        title: "Address Removed",
        description: "Address has been successfully removed",
      });
    },
    onError: () => {
      toast({
        title: "Failed to Remove Address",
        description: "Please try again",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (addresses.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="text-slate-400 dark:text-slate-500 mb-2">
          <svg
            className="mx-auto h-12 w-12"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </div>
        <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-1">
          No addresses added
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Add at least 2 addresses to optimize your route
        </p>
      </div>
    );
  }

  return (
    <div>
      {addresses.map((address, index) => (
        <div
          key={address.id}
          className="p-4 border-b border-gray-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
        >
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-medium mt-0.5">
              {index + 1}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                {address.name}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                {address.address}
              </p>
              <div className="flex items-center mt-2 space-x-2">
                {address.verified && (
                  <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    <Check className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex-shrink-0 flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                className="p-1 h-auto hover:bg-gray-200 dark:hover:bg-slate-700"
              >
                <Edit className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="p-1 h-auto hover:bg-red-100 dark:hover:bg-red-900/20 text-red-500"
                onClick={() => deleteAddressMutation.mutate(address.id)}
                disabled={deleteAddressMutation.isPending}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
