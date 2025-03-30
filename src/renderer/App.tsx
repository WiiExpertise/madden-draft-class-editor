import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import { Prospect } from 'madden-draft-class-tools';
import DraftClassViewer from './components/DraftClassViewer';
import './App.css';

// Keep track of the highest ID used
let nextProspectId = 1;

function Home() {
  const handleFileSelect = async (filePath: string) => {
    try {
      const draftClass = await window.electron.ipcRenderer.invoke(
        'parse-draft-class',
        filePath,
      );
      // Add unique IDs to prospects using a counter that only increases
      draftClass.prospects = draftClass.prospects.map((prospect: Prospect) => {
        const id = `prospect-${nextProspectId}`;
        nextProspectId += 1;
        return {
          ...prospect,
          id,
        };
      });
      return draftClass;
    } catch (error) {
      console.error('Error parsing draft class:', error);
      throw error;
    }
  };

  return (
    <div className="app-container">
      <DraftClassViewer onFileSelect={handleFileSelect} />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </Router>
  );
}
