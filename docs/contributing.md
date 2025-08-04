# Contributing to EveryTriv

## Getting Started

1. **Fork the Repository**
   - Visit the GitHub repository
   - Click the "Fork" button
   - Clone your fork locally

2. **Set Up Development Environment**
   - Follow the setup instructions in `docs/setup.md`
   - Install recommended VS Code extensions
   - Configure ESLint and Prettier

## Development Workflow

### 1. Branching Strategy

- `main` - Production-ready code
- `develop` - Development branch
- `feature/*` - New features
- `bugfix/*` - Bug fixes
- `hotfix/*` - Production hotfixes
- `release/*` - Release preparation

### 2. Creating a Feature

1. Create a new branch:
```bash
git checkout develop
git pull origin develop
git checkout -b feature/your-feature-name
```

2. Make your changes:
- Follow code style guidelines
- Write tests
- Update documentation
- Keep commits atomic

3. Commit your changes:
```bash
git add .
git commit -m "feat: add new feature"
```

### 3. Code Style

#### TypeScript
```typescript
// Use interfaces for object types
interface UserData {
  id: string;
  name: string;
  email: string;
}

// Use type for unions/intersections
type UserRole = 'admin' | 'user' | 'guest';

// Use proper access modifiers
class UserService {
  private readonly userRepository: Repository<User>;
  
  constructor(userRepository: Repository<User>) {
    this.userRepository = userRepository;
  }
  
  public async getUser(id: string): Promise<User> {
    // Implementation
  }
}

// Use async/await consistently
async function fetchData(): Promise<Data> {
  try {
    const response = await api.get('/data');
    return response.data;
  } catch (error) {
    handleError(error);
    throw error;
  }
}
```

#### React Components
```typescript
// Use functional components
const UserProfile: FC<UserProfileProps> = ({ user }) => {
  // Use hooks at the top
  const [isEditing, setIsEditing] = useState(false);
  const { data, isLoading } = useQuery(['user', user.id], fetchUserData);

  // Extract complex logic to hooks
  const { handleSubmit, values } = useForm();

  // Use early returns for loading/error states
  if (isLoading) return <Spinner />;

  return (
    <div className="user-profile">
      {/* JSX */}
    </div>
  );
};

// Export as default
export default UserProfile;
```

#### NestJS Controllers/Services
```typescript
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get(':id')
  async getUser(@Param('id') id: string): Promise<UserResponse> {
    return this.userService.getUser(id);
  }
}

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly cacheService: CacheService,
  ) {}

  async getUser(id: string): Promise<User> {
    // Implementation
  }
}
```

### 4. Testing

#### Unit Tests
```typescript
describe('UserService', () => {
  let service: UserService;
  let repository: MockType<Repository<User>>;

  beforeEach(() => {
    // Setup
  });

  it('should find a user by id', async () => {
    // Arrange
    const user = createMockUser();
    repository.findOne.mockResolvedValue(user);

    // Act
    const result = await service.getUser(user.id);

    // Assert
    expect(result).toEqual(user);
    expect(repository.findOne).toHaveBeenCalledWith({ id: user.id });
  });
});
```

#### Integration Tests
```typescript
describe('UserController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    // Setup application
  });

  it('/users/:id (GET)', () => {
    return request(app.getHttpServer())
      .get('/users/1')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('id');
      });
  });
});
```

### 5. Documentation

#### Code Documentation
```typescript
/**
 * Processes a trivia question for the given topic and difficulty.
 * 
 * @param topic - The topic for the trivia question
 * @param difficulty - The difficulty level (easy, medium, hard, or custom)
 * @param questionCount - The number of questions to generate (3, 4, or 5)
 * @returns A promise that resolves to the generated trivia question
 * @throws {ValidationError} If the input parameters are invalid
 * @throws {ProviderError} If the LLM provider fails to generate a question
 */
async function processTriviaQuestion(
  topic: string,
  difficulty: string,
  questionCount: number
): Promise<TriviaQuestion> {
  // Implementation
}
```

#### API Documentation
```typescript
@ApiOperation({ summary: 'Get user profile' })
@ApiResponse({
  status: 200,
  description: 'Returns the user profile',
  type: UserProfileResponse,
})
@ApiResponse({ status: 404, description: 'User not found' })
@Get('users/:id')
async getUserProfile(@Param('id') id: string): Promise<UserProfileResponse> {
  // Implementation
}
```

## Pull Request Process

1. **Before Submitting**
   - Run all tests: `pnpm test`
   - Run linter: `pnpm lint`
   - Update documentation
   - Rebase on latest develop

2. **PR Template**
```markdown
## Description
Brief description of the changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## How Has This Been Tested?
Describe the tests you ran

## Checklist
- [ ] My code follows the style guidelines
- [ ] I have performed a self-review
- [ ] I have commented my code
- [ ] I have updated the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests
- [ ] All tests pass
```

3. **Review Process**
   - Two approvals required
   - All comments must be resolved
   - CI checks must pass
   - Documentation updated

## Release Process

1. **Prepare Release**
```bash
git checkout develop
git pull origin develop
git checkout -b release/v1.0.0
```

2. **Update Version**
- Update version in package.json
- Update CHANGELOG.md
- Update documentation

3. **Create Release PR**
- Submit PR to main
- Get approvals
- Merge and tag

4. **Post-Release**
- Merge main back to develop
- Deploy to production
- Monitor for issues

## Getting Help

- Check existing issues
- Join Discord channel
- Review documentation
- Ask in discussions

## Code of Conduct

### Our Standards

- Be respectful and inclusive
- Focus on constructive feedback
- Maintain professional conduct
- Support fellow contributors

### Enforcement

- First violation: Warning
- Second violation: Temporary ban
- Third violation: Permanent ban

## Recognition

- Contributors listed in CONTRIBUTORS.md
- Significant contributions highlighted
- Regular contributor spotlights
- Special access for top contributors