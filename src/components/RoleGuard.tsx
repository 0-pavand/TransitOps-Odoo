import React, { useEffect, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';
import toast from 'react-hot-toast';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: Role[];
}

export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const { role, isLoading } = useAuth();
  const toastShownRef = useRef(false);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  const isAllowed = role ? allowedRoles.includes(role) : false;

  useEffect(() => {
    if (!isLoading && role && !isAllowed && !toastShownRef.current) {
      toastShownRef.current = true;
      toast.error('Access Denied: You do not have permission to view this page.');
      setShouldRedirect(true);
    }
  }, [isLoading, role, isAllowed]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-bg-primary text-text-primary">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
      </div>
    );
  }

  if (!role) {
    return <Navigate to="/login" replace />;
  }

  if (!isAllowed || shouldRedirect) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
