import { memo } from 'react';
import { Link } from 'react-router-dom';

import {
	ButtonVariant,
	ComponentSize,
	ContainerSize,
	NAVIGATION_BRAND_CLASSNAMES,
	NAVIGATION_BUTTON_CLASSNAMES,
	NAVIGATION_CLASSNAMES,
	NAVIGATION_LINK_CLASSNAMES,
	Spacing,
} from '../../constants';
import { useNavigationController } from '../../hooks';
import type {
	NavigationActionsProps,
	NavigationBrandProps,
	NavigationMenuProps,
	NavigationUserDisplay,
} from '../../types';
import { combineClassNames } from '../../utils';
import AudioControls from '../AudioControls';
import { Container } from '../layout';
import { Avatar, Button } from '../ui';
import { Icon } from '../ui/IconLibrary';

const NavigationRoot = memo(function Navigation() {
	const { appName, isHomePage, links, isAuthenticated, userDisplay, credits, actions } = useNavigationController();

	return (
		<nav role='navigation' aria-label='Main navigation' className={NAVIGATION_CLASSNAMES.wrapper}>
			<Container
				size={ContainerSize.FULL}
				maxWidth={ContainerSize.FULL}
				padding={Spacing.NONE}
				className={NAVIGATION_CLASSNAMES.container}
			>
				<div className={NAVIGATION_CLASSNAMES.row}>
					<section aria-label='Logo and Brand' className='flex flex-shrink-0 items-center'>
						<NavigationBrand isHome={isHomePage} appName={appName} onNavigateHome={actions.onNavigateHome} />
					</section>

					<NavigationMenu
						links={links}
						audioControls={<AudioControls className='text-slate-300' />}
						isAuthenticated={isAuthenticated}
						creditsDisplay={credits.display}
						totalCredits={credits.total}
						freeQuestions={credits.freeQuestions}
						nextResetTime={credits.nextResetTime}
						userDisplay={userDisplay}
						onLogout={actions.onLogout}
						onSignUp={actions.onSignUp}
						onSignIn={actions.onSignIn}
						onGetMoreCredits={actions.onGetMoreCredits}
					/>
				</div>
			</Container>
		</nav>
	);
});

export default NavigationRoot;

function NavigationBrand({ isHome, appName, onNavigateHome }: NavigationBrandProps) {
	if (isHome) {
		return (
			<div className={NAVIGATION_BRAND_CLASSNAMES.homeWrapper}>
				<div className={NAVIGATION_BRAND_CLASSNAMES.logoWrapper}>
					<Icon name='brain' size={ComponentSize.LG} className='text-white' />
				</div>
				<span className={NAVIGATION_BRAND_CLASSNAMES.homeTitle}>{appName}</span>
			</div>
		);
	}

	return (
		<Link
			to='/'
			className={NAVIGATION_BRAND_CLASSNAMES.link}
			onClick={() => {
				onNavigateHome?.();
			}}
		>
			<div className={NAVIGATION_BRAND_CLASSNAMES.logoWrapper}>
				<Icon name='brain' size={ComponentSize.LG} className='text-white' />
			</div>
			<span className={NAVIGATION_BRAND_CLASSNAMES.title}>{appName}</span>
		</Link>
	);
}

function NavigationActions({
	isAuthenticated,
	userDisplay,
	onLogout,
	onSignUp,
	onSignIn,
	children,
}: NavigationActionsProps) {
	return (
		<div className={NAVIGATION_CLASSNAMES.authContainer}>
			{children}
			{isAuthenticated ? (
				<>
					<div className={NAVIGATION_CLASSNAMES.userBadge}>
						<Avatar
							src={userDisplay?.avatar}
							email={userDisplay?.email}
							firstName={userDisplay?.firstName}
							lastName={userDisplay?.lastName}
							size={userDisplay?.avatarSize ?? ComponentSize.SM}
							alt={userDisplay?.email}
						/>
						<span className='text-sm font-medium text-slate-100'>
							{userDisplay?.firstName && userDisplay?.lastName
								? `${userDisplay.firstName} ${userDisplay.lastName}`
								: userDisplay?.firstName || userDisplay?.lastName || userDisplay?.email}
						</span>
					</div>
					<Button
						variant={ButtonVariant.GHOST}
						className={NAVIGATION_BUTTON_CLASSNAMES.logout}
						onClick={onLogout}
						withAnimation={false}
					>
						Logout
					</Button>
				</>
			) : (
				<>
					<Button
						variant={ButtonVariant.GHOST}
						className={NAVIGATION_BUTTON_CLASSNAMES.ghost}
						onClick={onSignUp}
						withAnimation={false}
					>
						Sign Up
					</Button>
					<Button
						variant={ButtonVariant.PRIMARY}
						className={NAVIGATION_BUTTON_CLASSNAMES.primary}
						onClick={onSignIn}
						withAnimation={false}
					>
						Sign In
					</Button>
				</>
			)}
		</div>
	);
}

function NavigationMenu({
	links,
	audioControls,
	isAuthenticated,
	creditsDisplay,
	totalCredits,
	freeQuestions,
	nextResetTime,
	userDisplay,
	onLogout,
	onSignUp,
	onSignIn,
	onGetMoreCredits,
}: NavigationMenuProps) {
	return (
		<section aria-label=' Navigation' className={NAVIGATION_CLASSNAMES.Section}>
			<div className={NAVIGATION_CLASSNAMES.LinksWrapper}>
				{links.map(item => (
					<Link
						key={item.path}
						to={item.path}
						className={combineClassNames(
							NAVIGATION_LINK_CLASSNAMES.base,
							item.isActive ? NAVIGATION_LINK_CLASSNAMES.active : NAVIGATION_LINK_CLASSNAMES.inactive
						)}
					>
						{item.label}
					</Link>
				))}
			</div>

			<NavigationActions
				isAuthenticated={isAuthenticated}
				userDisplay={augmentUserDisplay(userDisplay)}
				onLogout={onLogout}
				onSignUp={onSignUp}
				onSignIn={onSignIn}
			>
				<div className={NAVIGATION_CLASSNAMES.audioContainer}>{audioControls}</div>
				{isAuthenticated && (
					<div className='flex items-center gap-3'>
						<div className={NAVIGATION_CLASSNAMES.creditsBadge}>
							<Icon name='zap' size={ComponentSize.SM} className='text-amber-400' />
							<span className='text-slate-200 font-medium'>{creditsDisplay ?? totalCredits ?? 0}</span>
							<span className='text-xs text-slate-400'>Credits</span>
						</div>
						{freeQuestions && freeQuestions > 0 ? (
							<div className={NAVIGATION_CLASSNAMES.freeQuestionsBadge}>
								<span className='font-medium'>Free: {freeQuestions}</span>
								<Icon name='clock' size={ComponentSize.SM} className='text-emerald-400' />
								{nextResetTime && (
									<div className='text-xs text-emerald-300/80'>{new Date(nextResetTime).toLocaleTimeString()}</div>
								)}
							</div>
						) : (
							<button
								type='button'
								onClick={onGetMoreCredits}
								className='bg-transparent text-sm text-blue-400 underline transition-colors duration-150 hover:text-blue-300'
							>
								Get more credits
							</button>
						)}
					</div>
				)}
			</NavigationActions>
		</section>
	);
}

function augmentUserDisplay(userDisplay?: NavigationUserDisplay): NavigationActionsProps['userDisplay'] {
	if (!userDisplay) {
		return undefined;
	}

	return {
		...userDisplay,
		avatarSize: ComponentSize.SM,
	};
}
