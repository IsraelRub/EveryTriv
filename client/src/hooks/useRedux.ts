import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

import type { AppDispatch } from '../redux/store';
import type { RootState } from '../types';

/**
 * Typed useDispatch hook for Redux
 * @returns Typed dispatch function
 */
export const useAppDispatch = () => useDispatch<AppDispatch>();

/**
 * Typed useSelector hook for Redux
 * @returns Typed selector hook
 */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
