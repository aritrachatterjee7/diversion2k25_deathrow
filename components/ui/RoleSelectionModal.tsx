'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Trash2, Leaf } from "lucide-react";

type RoleSelectionModalProps = {
  showRoleModal: boolean;
  setShowRoleModal: (show: boolean) => void;
  handleRoleSelection: (role: 'reporter' | 'collector') => void;
}

export default function RoleSelectionModal({ 
  showRoleModal, 
  setShowRoleModal, 
  handleRoleSelection 
}: RoleSelectionModalProps) {

  const onSelectRole = (role: 'reporter' | 'collector') => {
    handleRoleSelection(role);
    setShowRoleModal(false);
  };

  return (
    <Dialog open={showRoleModal} onOpenChange={setShowRoleModal}>
      <DialogContent className="sm:max-w-md p-6 bg-gradient-to-b from-white to-gray-50 rounded-xl shadow-xl border border-gray-100">
        <DialogHeader className="space-y-2">
          <div className="flex items-center justify-center">
            <Leaf className="h-6 w-6 text-green-500 mr-2 animate-pulse" />
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              Welcome to Bin.AI
            </DialogTitle>
          </div>
          <DialogDescription className="text-center text-gray-600">
            Join our mission for a cleaner environment
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 space-y-4">
          <Button
            className="w-full group bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-3 rounded-lg flex flex-col items-center transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
            onClick={() => onSelectRole('reporter')}
          >
            <div className="flex items-center justify-center w-full space-x-3">
              <AlertTriangle className="h-6 w-6 group-hover:rotate-12 transition-transform duration-300" />
              <div className="flex flex-col items-start">
                <span className="text-lg font-semibold">Waste Reporter</span>
              </div>
            </div>
          </Button>

          <Button
            className="w-full group bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-3 rounded-lg flex flex-col items-center transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
            onClick={() => onSelectRole('collector')}
          >
            <div className="flex items-center justify-center w-full space-x-3">
              <Trash2 className="h-6 w-6 group-hover:rotate-12 transition-transform duration-300" />
              <div className="flex flex-col items-start">
                <span className="text-lg font-semibold">Waste Collector</span>
              </div>
            </div>
          </Button>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-center text-xs text-gray-500">
            Together we can create a sustainable future
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
