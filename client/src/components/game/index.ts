/**
 * Game Components Module
 *
 * @module GameComponents
 * @description React components for trivia game functionality, gameplay, and user interaction
 * @author EveryTriv Team
 * @used_by client/src/views, client/src/components
 */

/**
 * Main game component
 * @description Primary game interface, logic, and state management
 * @used_by client/src/views, client/src/components
 */
export { default as Game } from './Game';

/**
 * Trivia form component
 * @description Form for trivia question input, configuration, and submission
 * @used_by client/components/game, client/views
 */
export { default as TriviaForm } from './TriviaForm';

/**
 * trivia game component
 * @description Complete trivia game interface with question display and answer selection
 * @used_by client/src/views, client/src/components
 */
export { default as TriviaGame } from './TriviaGame';

/**
 * Game mode selection component
 * @description Component for selecting game mode (time-limited, question-limited, unlimited)
 * @used_by client/src/components/game/TriviaForm
 */
export { default as GameMode } from './GameMode';
