import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UserState } from '../../shared/models/User.model';

const initialState: UserState = {
  username: '',
  avatar: '',
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUsername(state, action: PayloadAction<string>) {
      state.username = action.payload;
    },
    setAvatar(state, action: PayloadAction<string>) {
      state.avatar = action.payload;
    },
    setUser(state, action: PayloadAction<{ username: string; avatar: string }>) {
      state.username = action.payload.username;
      state.avatar = action.payload.avatar;
    },
  },
});

export const { setUsername, setAvatar, setUser } = userSlice.actions;
export default userSlice.reducer; 