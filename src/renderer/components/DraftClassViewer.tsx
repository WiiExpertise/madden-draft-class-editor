import React, { useState } from 'react';
import { DraftClass, Prospect, Position, State, GenericHead, Handedness, College, PlayerArchetype } from '../../types/draft-class';
import calculateBestOverall from '../../utils/overall-calculator';
import './DraftClassViewer.css';
import collegeLookup from '../../../assets/collegeLookup.json';

interface DraftClassViewerProps {
  onFileSelect: (filePath: string) => Promise<DraftClass>;
}

// Create a mapping of college IDs to their proper names
const collegeNameMap = Object.fromEntries(
  collegeLookup.map(college => [college.COLLEGE_ID, college.Name])
);

function DraftClassViewer({ onFileSelect }: DraftClassViewerProps) {
  const [draftClass, setDraftClass] = useState<DraftClass | null>(null);
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [activeSection, setActiveSection] = useState<'personal' | 'ratings' | 'traits' | 'appearance'>('personal');

  const handleFileSelect = async () => {
    try {
      setLoading(true);
      setError(null);
      setSelectedProspect(null);
      setIsDirty(false);

      const filePath = await window.electron.ipcRenderer.invoke('open-file-dialog');

      if (filePath) {
        const data = await onFileSelect(filePath);
        setDraftClass(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load draft class file');
    } finally {
      setLoading(false);
    }
  };

  const handleProspectSelect = (prospect: Prospect) => {
    setSelectedProspect(prospect);
  };

  const handleProspectUpdate = (field: keyof Prospect, value: string | number) => {
    if (!draftClass || !selectedProspect) return;

    const updatedProspect = {
      ...selectedProspect,
      [field]: value,
    };

    // If a rating was changed, recalculate overall and archetype
    if (field !== 'overall' && field !== 'archetype' && typeof value === 'number') {
      const { overall, archetype } = calculateBestOverall(updatedProspect);
      updatedProspect.overall = overall;
      updatedProspect.archetype = archetype;
    }

    setSelectedProspect(updatedProspect);
    setDraftClass({
      ...draftClass,
      prospects: draftClass.prospects.map((p) =>
        p.id === updatedProspect.id ? updatedProspect : p,
      ),
    });
    setIsDirty(true);
  };

  const handleSaveFile = async () => {
    if (!draftClass) return;
    try {
      setLoading(true);
      await window.electron.ipcRenderer.invoke('save-draft-class', draftClass);
      setIsDirty(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save draft class file');
    } finally {
      setLoading(false);
    }
  };

  const formatStateName = (key: string) => {
    // Special cases
    if (key === 'NonUS') return 'Non-US';
    if (key === 'INVALID') return 'Invalid';

    // Handle prefixes
    if (key.startsWith('Canada')) {
      return key.replace('Canada', 'Canada - ').replace(/([A-Z])/g, ' $1').trim();
    }
    if (key.startsWith('Australia')) {
      return key.replace('Australia', 'Australia - ').replace(/([A-Z])/g, ' $1').trim();
    }

    // Handle regular state names
    return key.replace(/([A-Z])/g, ' $1').trim();
  };

  const formatFieldName = (field: string) => {
    // Remove 'trait' prefix if it exists
    field = field.replace('trait', '');

    // Split by capital letters and join with spaces
    return field
      .replace(/([A-Z])/g, ' $1') // Add space before capital letters
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Capitalize first letter of each word
      .join(' ')
      .trim();
  };

  const renderPersonalInfo = () => {
    if (!selectedProspect) return null;

    return (
      <div className="personal-info-section">
        <div className="form-group">
          <label htmlFor="firstName">First Name:</label>
          <input
            type="text"
            id="firstName"
            value={selectedProspect.firstName}
            onChange={(e) => handleProspectUpdate('firstName', e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="lastName">Last Name:</label>
          <input
            type="text"
            id="lastName"
            value={selectedProspect.lastName}
            onChange={(e) => handleProspectUpdate('lastName', e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="homeState">Home State:</label>
          <select
            id="homeState"
            value={selectedProspect.homeState}
            onChange={(e) => handleProspectUpdate('homeState', parseInt(e.target.value, 10))}
          >
            {Object.entries(State)
              .filter(([key]) => !Number.isInteger(Number(key)))
              .map(([key, value]) => (
                <option key={value} value={value}>
                  {formatStateName(key)}
                </option>
              ))}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="homeTown">Home Town:</label>
          <input
            type="text"
            id="homeTown"
            value={selectedProspect.homeTown}
            onChange={(e) => handleProspectUpdate('homeTown', e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="college">College:</label>
          <select
            id="college"
            value={selectedProspect.college}
            onChange={(e) => handleProspectUpdate('college', parseInt(e.target.value, 10))}
          >
            {Object.entries(College)
              .filter(([key]) => !Number.isInteger(Number(key)))
              .map(([key, value]) => (
                <option key={value} value={value}>
                  {key}
                </option>
              ))}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="age">Age:</label>
          <input
            type="number"
            id="age"
            value={selectedProspect.age}
            onChange={(e) => handleProspectUpdate('age', parseInt(e.target.value))}
          />
        </div>
        <div className="form-group">
          <label htmlFor="heightInches">Height (inches):</label>
          <input
            type="number"
            id="heightInches"
            value={selectedProspect.heightInches}
            onChange={(e) => handleProspectUpdate('heightInches', parseInt(e.target.value))}
          />
        </div>
        <div className="form-group">
          <label htmlFor="weight">Weight:</label>
          <input
            type="number"
            id="weight"
            value={selectedProspect.weight}
            onChange={(e) => handleProspectUpdate('weight', parseInt(e.target.value))}
          />
        </div>
        <div className="form-group">
          <label htmlFor="position">Position:</label>
          <select
            id="position"
            value={selectedProspect.position}
            onChange={(e) => {
              const newPosition = parseInt(e.target.value);
              const updatedProspect = {
                ...selectedProspect,
                position: newPosition,
              };
              const { overall, archetype } = calculateBestOverall(updatedProspect);
              updatedProspect.overall = overall;
              updatedProspect.archetype = archetype;
              handleProspectUpdate('position', newPosition);
            }}
          >
            {Object.entries(Position)
              .filter(([key]) => isNaN(Number(key)))
              .map(([key, value]) => (
                <option key={key} value={value}>
                  {key}
                </option>
              ))}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="overall">Overall:</label>
          <input
            type="number"
            id="overall"
            value={selectedProspect.overall}
            disabled
            className="read-only"
          />
        </div>
        <div className="form-group">
          <label htmlFor="archetype">Archetype:</label>
          <select
            id="archetype"
            value={selectedProspect.archetype}
            disabled
            className="read-only"
          >
            {Object.entries(PlayerArchetype)
              .filter(([key]) => !Number.isInteger(Number(key)))
              .map(([key, value]) => (
                <option key={value} value={value}>
                  {key}
                </option>
              ))}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="jerseyNum">Jersey Number:</label>
          <input
            type="number"
            id="jerseyNum"
            value={selectedProspect.jerseyNum}
            onChange={(e) => handleProspectUpdate('jerseyNum', parseInt(e.target.value))}
          />
        </div>
      </div>
    );
  };

  const renderRatings = () => {
    if (!selectedProspect) return null;

    const ratingFields = [
      'acceleration', 'agility', 'awareness', 'ballCarrierVision',
      'blockShedding', 'breakSack', 'breakTackle', 'carrying', 'catching',
      'catchInTraffic', 'changeOfDirection', 'finesseMoves', 'hitPower',
      'impactBlocking', 'injury', 'jukeMove', 'jumping', 'kickAccuracy',
      'kickPower', 'kickReturn', 'leadBlock', 'manCoverage', 'passBlockFinesse',
      'passBlockPower', 'passBlock', 'personality', 'playAction', 'playRecognition',
      'powerMoves', 'pressCoverage', 'pursuit', 'release', 'shortRouteRunning',
      'mediumRouteRunning', 'deepRouteRunning', 'runBlockFinesse', 'runBlockPower',
      'runBlock', 'runningStyle', 'spectacularCatch', 'speed', 'spinMove',
      'stamina', 'stiffArm', 'strength', 'tackle', 'throwAccuracyDeep',
      'throwAccuracyMid', 'throwAccuracy', 'throwAccuracyShort', 'throwOnTheRun',
      'throwPower', 'throwUnderPressure', 'toughness', 'trucking', 'zoneCoverage',
      'morale'
    ] as const;

    return (
      <div className="section-content ratings-grid">
        {ratingFields.map((field) => (
          <div key={field} className="form-group">
            <label htmlFor={field}>{formatFieldName(field)}</label>
            <input
              type="number"
              id={field}
              value={selectedProspect[field]}
              onChange={(e) => handleProspectUpdate(field, Number(e.target.value))}
              min="0"
              max="99"
            />
          </div>
        ))}
      </div>
    );
  };

  const renderTraits = () => {
    if (!selectedProspect) return null;

    const traitFields = [
      'traitBigHitter', 'traitPossessionCatch', 'traitClutch', 'traitCoverBall',
      'traitDeepBall', 'traitDlBullRush', 'traitDlSpinMove', 'traitDlSwimMove',
      'traitDropsOpen', 'traitSidelineCatch', 'traitFightForYards', 'traitUnk1',
      'traitHighMotor', 'traitAggressiveCatch', 'traitPenalty', 'traitPlayBall',
      'traitPumpFake', 'traitLbStyle', 'traitSensePressure', 'traitUnk2',
      'traitStripBall', 'traitTackleLow', 'traitThrowAway', 'traitTightSpiral',
      'traitTendency', 'traitRunAfterCatch', 'devTrait', 'traitPredictability'
    ] as const;

    return (
      <div className="section-content traits-grid">
        {traitFields.map((field) => (
          <div key={field} className="form-group">
            <label htmlFor={field}>{formatFieldName(field)}</label>
            <input
              type="number"
              id={field}
              value={selectedProspect[field]}
              onChange={(e) => handleProspectUpdate(field, Number(e.target.value))}
              min="0"
              max="255"
            />
          </div>
        ))}
      </div>
    );
  };

  const renderAppearance = () => {
    if (!selectedProspect) return null;

    return (
      <div className="section-content">
        <div className="form-group">
          <label htmlFor="visuals">Visuals (JSON)</label>
          <textarea
            id="visuals"
            value={JSON.stringify(selectedProspect.visuals, null, 2)}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                handleProspectUpdate('visuals', parsed);
              } catch (err) {
                // Invalid JSON, don't update
              }
            }}
            rows={10}
          />
        </div>
        <div className="form-group">
          <label htmlFor="genericHead">Generic Head</label>
          <select
            id="genericHead"
            value={selectedProspect.genericHead}
            onChange={(e) => handleProspectUpdate('genericHead', Number(e.target.value))}
          >
            {Object.entries(GenericHead)
              .filter(([key]) => Number.isNaN(Number(key)))
              .map(([key, value]) => (
                <option key={key} value={value}>
                  {key}
                </option>
              ))}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="handedness">Handedness</label>
          <select
            id="handedness"
            value={selectedProspect.handedness}
            onChange={(e) => handleProspectUpdate('handedness', e.target.value)}
          >
            <option value={Handedness.Right}>Right</option>
            <option value={Handedness.Left}>Left</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="portraitId">Portrait ID</label>
          <input
            type="number"
            id="portraitId"
            value={selectedProspect.portraitId}
            onChange={(e) => handleProspectUpdate('portraitId', Number(e.target.value))}
            min="0"
            max="65535"
          />
        </div>
        <div className="form-group">
          <label htmlFor="qbStyle">QB Style</label>
          <input
            type="number"
            id="qbStyle"
            value={selectedProspect.qbStyle}
            onChange={(e) => handleProspectUpdate('qbStyle', Number(e.target.value))}
            min="0"
            max="255"
          />
        </div>
        <div className="form-group">
          <label htmlFor="qbStance">QB Stance</label>
          <input
            type="number"
            id="qbStance"
            value={selectedProspect.qbStance}
            onChange={(e) => handleProspectUpdate('qbStance', Number(e.target.value))}
            min="0"
            max="255"
          />
        </div>
      </div>
    );
  };

  return (
    <div className="draft-class-viewer">
      <div className="header">
        <h1>Madden Draft Class Editor</h1>
        <div className="header-buttons">
          {isDirty && (
            <button
              type="button"
              className="save-file-button"
              onClick={handleSaveFile}
              disabled={loading}
            >
              Save File
            </button>
          )}
          <button
            type="button"
            className="open-file-button"
            onClick={handleFileSelect}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Open Draft Class File'}
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {draftClass && (
        <div className="draft-class-content">
          <div className="prospects-list">
            <h3>Prospects</h3>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Position</th>
                    <th>Overall</th>
                    <th>Age</th>
                  </tr>
                </thead>
                <tbody>
                  {draftClass.prospects.map((prospect) => (
                    <tr
                      key={prospect.id}
                      className={selectedProspect?.id === prospect.id ? 'selected' : ''}
                      onClick={() => handleProspectSelect(prospect)}
                    >
                      <td>{`${prospect.firstName} ${prospect.lastName}`}</td>
                      <td>{Position[prospect.position]}</td>
                      <td>{prospect.overall}</td>
                      <td>{prospect.age}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="prospect-details">
            {selectedProspect ? (
              <>
                <div className="section-tabs">
                  <button
                    type="button"
                    className={`section-tab ${activeSection === 'personal' ? 'active' : ''}`}
                    onClick={() => setActiveSection('personal')}
                  >
                    Personal Info
                  </button>
                  <button
                    type="button"
                    className={`section-tab ${activeSection === 'ratings' ? 'active' : ''}`}
                    onClick={() => setActiveSection('ratings')}
                  >
                    Ratings
                  </button>
                  <button
                    type="button"
                    className={`section-tab ${activeSection === 'traits' ? 'active' : ''}`}
                    onClick={() => setActiveSection('traits')}
                  >
                    Traits
                  </button>
                  <button
                    type="button"
                    className={`section-tab ${activeSection === 'appearance' ? 'active' : ''}`}
                    onClick={() => setActiveSection('appearance')}
                  >
                    Appearance
                  </button>
                </div>

                <div className="section-content">
                  {activeSection === 'personal' && renderPersonalInfo()}
                  {activeSection === 'ratings' && renderRatings()}
                  {activeSection === 'traits' && renderTraits()}
                  {activeSection === 'appearance' && renderAppearance()}
                </div>
              </>
            ) : (
              <h3>Select a prospect to edit</h3>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default DraftClassViewer;
