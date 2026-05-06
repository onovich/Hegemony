import OriginApp from '../../../origin/App.jsx';
import ScreenMountNote from '../components/ScreenMountNote.jsx';
import { useArchitectureStatus } from '../../logic/hooks/useArchitectureStatus.js';

export default function HegemonyScreen() {
  useArchitectureStatus();

  return (
    <>
      <ScreenMountNote />
      <OriginApp />
    </>
  );
}