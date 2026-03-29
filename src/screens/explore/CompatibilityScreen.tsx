import React from 'react';
import CompatibilityModal from '@/components/shared/CompatibilityModal';

interface Props { onClose: () => void; }

export default function CompatibilityScreen({ onClose }: Props) {
  return <CompatibilityModal visible={true} onClose={onClose} />;
}
