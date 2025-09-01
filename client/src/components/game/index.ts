/**
 * Game Components Module
 *
 * @module GameComponents
 * @description React components for trivia game functionality, gameplay, and user interaction
 * @version 1.0.0
 * @author EveryTriv Team
 * @used_by client/views, client/components
 */

/**
 * Main game component
 * @description Primary game interface, logic, and state management
 * @used_by client/views, client/components
 */
export { default as Game } from './Game';

/**
 * Game timer component
 * @description Timer display, countdown functionality, and time management
 * @used_by client/components/game, client/views
 */
export { default as GameTimer } from './GameTimer';

/**
 * Trivia form component
 * @description Form for trivia question input, configuration, and submission
 * @used_by client/components/game, client/views
 */
export { default as TriviaForm } from './TriviaForm';

/**
 * Unified trivia game component
 * @description Complete trivia game interface with question display and answer selection
 * @used_by client/views, client/components
 */
export { default as TriviaGame } from './TriviaGame';
