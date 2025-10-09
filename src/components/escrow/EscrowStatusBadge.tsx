import React from 'react';
import { Shield, Clock, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

interface EscrowStatusBadgeProps {
  status: 'pending' | 'funded' | 'completed' | 'disputed' | 'released' | 'refunded';
  amount?: number;
  className?: string;
}

export const EscrowStatusBadge: React.FC<EscrowStatusBadgeProps> = ({
  status,
  amount,
  className = '',
}) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          icon: Clock,
          text: 'Payment Pending',
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-800',
          iconColor: 'text-yellow-600',
        };
      case 'funded':
        return {
          icon: Shield,
          text: 'Escrow Secured',
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-800',
          iconColor: 'text-blue-600',
        };
      case 'completed':
        return {
          icon: CheckCircle,
          text: 'Service Completed',
          bgColor: 'bg-green-100',
          textColor: 'text-green-800',
          iconColor: 'text-green-600',
        };
      case 'disputed':
        return {
          icon: AlertTriangle,
          text: 'Under Dispute',
          bgColor: 'bg-red-100',
          textColor: 'text-red-800',
          iconColor: 'text-red-600',
        };
      case 'released':
        return {
          icon: CheckCircle,
          text: 'Payment Released',
          bgColor: 'bg-green-100',
          textColor: 'text-green-800',
          iconColor: 'text-green-600',
        };
      case 'refunded':
        return {
          icon: XCircle,
          text: 'Payment Refunded',
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800',
          iconColor: 'text-gray-600',
        };
      default:
        return {
          icon: Clock,
          text: 'Unknown Status',
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800',
          iconColor: 'text-gray-600',
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.bgColor} ${config.textColor} ${className}`}>
      <Icon className={`w-4 h-4 mr-2 ${config.iconColor}`} />
      <span>{config.text}</span>
      {amount && (
        <span className="ml-2 font-semibold">₵{amount}</span>
      )}
    </div>
  );
};