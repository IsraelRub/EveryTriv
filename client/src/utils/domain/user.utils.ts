export const getUserInitials = (firstName?: string | null, lastName?: string | null, email?: string | null): string => {
	if (firstName && lastName) {
		return `${firstName.charAt(0).toUpperCase()}${lastName.charAt(0).toUpperCase()}`;
	}
	if (firstName) {
		return firstName.charAt(0).toUpperCase();
	}
	if (email) {
		return email.charAt(0).toUpperCase();
	}
	return 'U';
};
