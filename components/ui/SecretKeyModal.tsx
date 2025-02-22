import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface SecretKeyModalProps {
  showModal: boolean;
  onClose: () => void;
  onSubmit: (secretKey: string) => void;
}

const SecretKeyModal: React.FC<SecretKeyModalProps> = ({ showModal, onClose, onSubmit }) => {
  const [secretKey, setSecretKey] = useState('');

  const handleSubmit = () => {
    onSubmit(secretKey);
    setSecretKey(''); // Clear the input field after submission
  };

  return (
    <Dialog open={showModal} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enter Your Secret Key</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <input
            type="password"
            placeholder="Secret Key"
            value={secretKey}
            onChange={(e) => setSecretKey(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div className="mt-4 flex justify-end">
          <Button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700 text-white">
            Submit
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SecretKeyModal;
