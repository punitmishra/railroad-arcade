# Railroad Arcade v1.2 Roadmap - Engagement Features

## Overview

Version 1.2 focuses on player engagement and retention through daily challenges, rewards systems, customization, and seasonal content.

---

## Features

### 1. Daily Challenges

**Purpose:** Give players a reason to return every day with unique objectives.

#### Implementation

```typescript
// lib/challenges.ts
interface DailyChallenge {
  id: string;
  type: 'laps' | 'speed' | 'precision' | 'efficiency' | 'exploration';
  title: string;
  description: string;
  target: number;
  tokenReward: number;
  xpReward: number;
  expiresAt: Date;
}

const CHALLENGE_TYPES = {
  laps: {
    templates: [
      { title: 'Lap Master', description: 'Complete {target} laps on Level 2', target: [10, 15, 20] },
      { title: 'Endurance Run', description: 'Complete {target} total laps', target: [25, 40, 50] },
    ]
  },
  speed: {
    templates: [
      { title: 'Speed Demon', description: 'Reach {target} km/h on any train', target: [80, 90, 100] },
      { title: 'Express Service', description: 'Maintain {target} km/h for 60 seconds', target: [60, 70, 80] },
    ]
  },
  precision: {
    templates: [
      { title: 'Junction Master', description: 'Switch {target} junctions successfully', target: [20, 30, 50] },
      { title: 'Crossing Guard', description: 'Operate crossings {target} times', target: [15, 25, 40] },
    ]
  },
  efficiency: {
    templates: [
      { title: 'No Stops', description: 'Run trains for {target} minutes without emergency stop', target: [5, 10, 15] },
      { title: 'Token Saver', description: 'Earn {target} points spending only {tokens} tokens', target: [[500, 5], [1000, 8]] },
    ]
  },
  exploration: {
    templates: [
      { title: 'Full Coverage', description: 'Use all {target} camera views', target: [4, 6, 8] },
      { title: 'Module Master', description: 'Interact with {target} different modules', target: [3, 5, 7] },
    ]
  }
};
```

#### Database Schema

```prisma
model DailyChallenge {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  type        String
  title       String
  description String
  target      Int
  progress    Int      @default(0)
  tokenReward Int
  xpReward    Int
  completed   Boolean  @default(false)
  completedAt DateTime?
  expiresAt   DateTime
  createdAt   DateTime @default(now())

  @@index([userId, expiresAt])
}
```

#### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/challenges/daily` | Get today's challenges |
| POST | `/api/challenges/progress` | Update challenge progress |
| POST | `/api/challenges/claim` | Claim completed challenge reward |

---

### 2. Streak Rewards

**Purpose:** Reward consecutive daily logins to build habits.

#### Streak Tiers

| Days | Reward | Bonus |
|------|--------|-------|
| 1 | 5 tokens | - |
| 2 | 5 tokens | - |
| 3 | 10 tokens | Bronze badge |
| 5 | 15 tokens | - |
| 7 | 25 tokens | Silver badge |
| 14 | 50 tokens | Gold badge |
| 30 | 100 tokens | Platinum badge + Exclusive train skin |

#### Implementation

```typescript
// lib/streaks.ts
interface StreakReward {
  day: number;
  tokens: number;
  badge?: string;
  specialReward?: string;
}

const STREAK_REWARDS: StreakReward[] = [
  { day: 1, tokens: 5 },
  { day: 2, tokens: 5 },
  { day: 3, tokens: 10, badge: 'streak_bronze' },
  { day: 5, tokens: 15 },
  { day: 7, tokens: 25, badge: 'streak_silver' },
  { day: 14, tokens: 50, badge: 'streak_gold' },
  { day: 30, tokens: 100, badge: 'streak_platinum', specialReward: 'skin_golden_express' },
];

function calculateStreakReward(currentStreak: number): StreakReward {
  // Find the highest applicable reward
  return STREAK_REWARDS
    .filter(r => r.day <= currentStreak)
    .sort((a, b) => b.day - a.day)[0] || { day: 1, tokens: 5 };
}
```

#### Database Schema

```prisma
model UserStreak {
  id            String   @id @default(cuid())
  userId        String   @unique
  user          User     @relation(fields: [userId], references: [id])
  currentStreak Int      @default(0)
  longestStreak Int      @default(0)
  lastLoginDate DateTime
  totalLogins   Int      @default(0)
  updatedAt     DateTime @updatedAt
}
```

---

### 3. Train Skin Customization

**Purpose:** Visual personalization to increase attachment and show off achievements.

#### Skin Categories

| Category | Examples | Unlock Method |
|----------|----------|---------------|
| Standard | Red, Blue, Green, Yellow | Default |
| Premium | Chrome, Carbon Fiber, Neon | Token purchase (50-100 tokens) |
| Seasonal | Holiday Express, Summer Special | Limited-time events |
| Achievement | Golden Express, Speed Demon | Unlock via achievements |
| Legendary | Rainbow, Galaxy, Lightning | 30-day streak or tournament win |

#### Implementation

```typescript
// lib/skins.ts
interface TrainSkin {
  id: string;
  name: string;
  category: 'standard' | 'premium' | 'seasonal' | 'achievement' | 'legendary';
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    glow?: string;
  };
  effects?: {
    trail?: 'none' | 'sparkle' | 'flame' | 'rainbow';
    headlight?: 'standard' | 'bright' | 'colored';
  };
  unlockMethod: {
    type: 'default' | 'purchase' | 'achievement' | 'streak' | 'event';
    requirement?: string | number;
  };
}

const TRAIN_SKINS: TrainSkin[] = [
  {
    id: 'classic_red',
    name: 'Classic Red',
    category: 'standard',
    colors: { primary: '#ef4444', secondary: '#dc2626', accent: '#fca5a5' },
    unlockMethod: { type: 'default' }
  },
  {
    id: 'chrome_silver',
    name: 'Chrome Silver',
    category: 'premium',
    colors: { primary: '#e5e7eb', secondary: '#9ca3af', accent: '#ffffff', glow: '#60a5fa' },
    effects: { headlight: 'bright' },
    unlockMethod: { type: 'purchase', requirement: 75 }
  },
  {
    id: 'golden_express',
    name: 'Golden Express',
    category: 'legendary',
    colors: { primary: '#fbbf24', secondary: '#d97706', accent: '#fef3c7', glow: '#fcd34d' },
    effects: { trail: 'sparkle', headlight: 'colored' },
    unlockMethod: { type: 'streak', requirement: 30 }
  },
];
```

#### UI Components

```tsx
// components/SkinSelector.tsx
function SkinSelector({ trainId, onSelect }: Props) {
  const { unlockedSkins } = useUser();
  const [selectedSkin, setSelectedSkin] = useState(null);

  return (
    <div className="grid grid-cols-4 gap-3">
      {TRAIN_SKINS.map(skin => {
        const isUnlocked = unlockedSkins.includes(skin.id);
        return (
          <button
            key={skin.id}
            onClick={() => isUnlocked && onSelect(skin.id)}
            className={`p-3 rounded-xl border ${
              isUnlocked ? 'border-white/20' : 'border-white/5 opacity-50'
            }`}
          >
            <TrainPreview colors={skin.colors} />
            <span className="text-xs">{skin.name}</span>
            {!isUnlocked && <LockIcon />}
          </button>
        );
      })}
    </div>
  );
}
```

---

### 4. Seasonal Themes

**Purpose:** Keep the experience fresh with time-limited visual and gameplay changes.

#### Seasonal Calendar

| Season | Dates | Theme | Special Features |
|--------|-------|-------|------------------|
| Winter Wonderland | Dec 1 - Jan 7 | Snow, lights | Snow particles, holiday music |
| Spring Festival | Mar 15 - Apr 15 | Cherry blossoms | Flower particles, pastel colors |
| Summer Express | Jun 1 - Aug 31 | Sunny, beach | Sun glare, tropical scenery |
| Halloween Haunt | Oct 15 - Nov 5 | Spooky, dark | Fog, ghost trains, pumpkins |

#### Implementation

```typescript
// lib/seasons.ts
interface SeasonalTheme {
  id: string;
  name: string;
  startDate: string; // MM-DD
  endDate: string;   // MM-DD
  theme: {
    background: string;
    trackGlow: string;
    particles?: 'snow' | 'leaves' | 'flowers' | 'fog';
    music?: string;
  };
  exclusives: {
    skins: string[];
    challenges: string[];
    badges: string[];
  };
}

function getCurrentSeason(): SeasonalTheme | null {
  const now = new Date();
  const monthDay = `${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;

  return SEASONAL_THEMES.find(theme => {
    const start = theme.startDate;
    const end = theme.endDate;

    // Handle year wrap (e.g., Dec 1 - Jan 7)
    if (start > end) {
      return monthDay >= start || monthDay <= end;
    }
    return monthDay >= start && monthDay <= end;
  }) || null;
}
```

#### Visual Effects

```tsx
// components/SeasonalEffects.tsx
function SeasonalEffects() {
  const season = getCurrentSeason();
  if (!season?.theme.particles) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {season.theme.particles === 'snow' && <SnowfallEffect />}
      {season.theme.particles === 'leaves' && <FallingLeavesEffect />}
      {season.theme.particles === 'flowers' && <CherryBlossomEffect />}
      {season.theme.particles === 'fog' && <FogEffect />}
    </div>
  );
}
```

---

## Database Migrations

```prisma
// Add to schema.prisma

model UserStreak {
  id            String   @id @default(cuid())
  userId        String   @unique
  user          User     @relation(fields: [userId], references: [id])
  currentStreak Int      @default(0)
  longestStreak Int      @default(0)
  lastLoginDate DateTime
  totalLogins   Int      @default(0)
  updatedAt     DateTime @updatedAt
}

model DailyChallenge {
  id          String    @id @default(cuid())
  userId      String
  user        User      @relation(fields: [userId], references: [id])
  type        String
  title       String
  description String
  target      Int
  progress    Int       @default(0)
  tokenReward Int
  xpReward    Int
  completed   Boolean   @default(false)
  completedAt DateTime?
  expiresAt   DateTime
  createdAt   DateTime  @default(now())

  @@index([userId, expiresAt])
}

model UserSkin {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  skinId    String
  equipped  Boolean  @default(false)
  unlockedAt DateTime @default(now())

  @@unique([userId, skinId])
}

// Update User model
model User {
  // ... existing fields
  streaks         UserStreak?
  dailyChallenges DailyChallenge[]
  skins           UserSkin[]
  xp              Int              @default(0)
  level           Int              @default(1)
}
```

---

## API Endpoints Summary

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/challenges/daily` | GET | Get today's challenges |
| `/api/challenges/progress` | POST | Update challenge progress |
| `/api/challenges/claim` | POST | Claim completed reward |
| `/api/streaks` | GET | Get user streak info |
| `/api/streaks/claim` | POST | Claim daily login reward |
| `/api/skins` | GET | Get all skins with unlock status |
| `/api/skins/equip` | POST | Equip a skin to a train |
| `/api/skins/purchase` | POST | Purchase a premium skin |
| `/api/seasons/current` | GET | Get current seasonal theme |

---

## UI Components Needed

1. **DailyChallengeCard** - Shows challenge progress with claim button
2. **StreakCounter** - Displays current streak with calendar visualization
3. **SkinSelector** - Grid of available skins with preview
4. **SkinPreview** - 3D or animated train preview with skin applied
5. **SeasonalBanner** - Promotes current seasonal event
6. **RewardPopup** - Celebration animation for rewards
7. **LevelProgress** - XP bar showing progress to next level

---

## Timeline

| Week | Focus |
|------|-------|
| 1 | Database schema, API endpoints for challenges |
| 2 | Daily challenges UI, progress tracking |
| 3 | Streak system, login rewards |
| 4 | Train skins - data model, basic UI |
| 5 | Skin customization UI, preview |
| 6 | Seasonal themes foundation |
| 7 | Testing, polish, seasonal content |
| 8 | Release v1.2 |

---

## Success Metrics

- **DAU/MAU ratio** - Target: 30%+ (indicates daily engagement)
- **Streak retention** - % of users maintaining 7+ day streaks
- **Challenge completion rate** - Target: 40%+ of daily active users
- **Skin purchase conversion** - % of users buying premium skins
- **Session length** - Increase average session by 20%

---

## Future Considerations (v1.3+)

- Friend challenges (compete with friends)
- Guilds/Teams with shared challenges
- Weekly tournaments with skin rewards
- User-created challenges
- Achievement showcase/profile customization
