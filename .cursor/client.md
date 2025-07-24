# EveryTriv Client Instructions

## Folder Structure

- **assets/**  
  Static assets (images, icons, etc.) used in the client application. Should only contain files that are actually used in the UI.

- **redux/**  
  State management using Redux Toolkit.  
  - `store.ts`: Redux store configuration.  
  - `hooks.ts`: Typed hooks for dispatch and selector.  
  - `features/`: Contains Redux slices (e.g., `userSlice.ts`).  
  - `models/`: (Currently empty) For Redux-related TypeScript models.

- **shared/**  
  Shared code across the client app.  
  - `components/`: Shared React components (currently only `loaderSpinnerCircle/`, which is empty).  
  - `models/`: (Empty) For shared TypeScript interfaces/models.  
  - `services/`: (Empty) For shared utility or service files.

- **views/**  
  Main feature screens and UI views.  
  - `user/`: User profile screen (`UserProfile.tsx`).  
  - `home/`: Home screen, leaderboard, scoring system.  
  - `example/`, `loginView/`: (Empty, should be deleted if not used).

- **App.tsx**  
  Main App component.

- **AppRoutes.tsx**  
  React Router configuration for the app.

- **main.tsx**  
  Entry point for the React app, renders the App and sets up Redux Provider.

- **index.css**  
  Global styles.

## State Management
- Global state is managed using Redux (see `redux/store.ts`, `redux/features/userSlice.ts`).
- Use `useAppSelector` and `useAppDispatch` (from `redux/hooks.ts`) for accessing state and dispatching actions in components.

## Main Components
- All main features/screens are under `views/` (e.g., `views/user/UserProfile.tsx`, `views/home/HomeView.tsx`).
- Only keep directories and files that are actually used in the project.

## Assets
- Store only assets that are actively used in the project.
- Remove unused files from the `assets` directory.

## Shared
- Only keep shared components, services, or models that are actually imported and used.
- Do not leave empty or unused files/directories in `shared/`.

## Views
- Each directory under `views/` should represent a real feature or screen.
- Remove example or unused feature directories.

## Testing
- Do not keep a `test` directory in the client unless it is actively used for tests.

## General
- Keep the codebase clean and synchronized: remove unused files, directories, and code.
- Do not leave example, template, or placeholder files in the repository. 