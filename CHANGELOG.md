# Changelog

## Changelog Guidelines

### 🎯 Purpose

Changelogs communicate the evolution of the game to players, highlighting new features, improvements, and fixes in a clear, engaging way.

### 📝 Writing Rules

**Format & Structure**

- Use semantic versioning: `[MAJOR.MINOR.PATCH] - YYYY-MM-DD`
- Group changes under emoji-prefixed category headers
- Use bold subheadings for feature groups
- Separate versions with `---` dividers
- Keep entries concise but descriptive

**Content Guidelines**

- Focus on user benefits, not technical implementation
- Write in friendly, accessible language for players
- Avoid jargon, internal code names, and technical details
- Highlight gameplay improvements and new features
- Group related changes under logical subheadings

**Categories & Emojis**

- `🎮` - New game features and mechanics
- `🎯` - Rule changes and balance updates
- `🔧` - Technical improvements and bug fixes
- `⚡` - Performance enhancements
- `🎨` - Visual and UI improvements
- `🔊` - Audio and sound updates
- `🌐` - Multiplayer and social features

**Language & Tone**

- Use active voice and present tense for new features
- Focus on what players can now do or experience
- Keep positive and exciting tone
- Be specific about gameplay impacts
- Use player-centric language ("you can now...", "experience smoother...")

**What to Include**

- New gameplay mechanics and features
- Balance changes and rule improvements
- Major bug fixes that affect gameplay
- Performance improvements players will notice
- Visual and audio enhancements

**What to Exclude**

- Internal refactoring and code cleanup
- Minor technical fixes not visible to players
- Development tool updates
- Dependency version bumps
- Purely technical optimizations

---

## [Unreleased] - Season 3

### 🏆 A fresh start

- Season 3 starts everyone at a 1500 rating and Private rank, with no wins or losses
- Your record from before is saved on your profile under "Seasons 1 and 2": final rating, where you placed, rank, wins, losses and best streak
- The leaderboard shows players with at least one win this season
- Setups are checked on the server: an army must be the standard 21 pieces, one per square, and can't be changed after you lock it in
- New global chat messages show up for everyone straight away, including a player's first message

### 🔗 Easier to find and share

- Links to the game now show a Season 3 preview card on Messenger, Facebook, X and Discord
- The About, Plans, Privacy and Terms pages each have their own title and description in search results
- Search engines only list the public pages, not sign-in screens or admin pages
- Each tab shows the page you're on, with your unread message count in front

### ⚡ Faster on every visit

- The first page downloads about half as much code, and each page loads its own code when you open it
- Music and sounds load when they first play instead of all at once, which saves about 2 MB of data on every visit
- Return visits reuse what your browser already downloaded instead of checking every file again
- Match history pages now go back through all your games for your plan, without repeats
- Support screenshots keep the whole image instead of being cropped to a square
- Changing your picture no longer downloads a large image library first

### 🎨 A cleaner look for Season 3

**Every screen, refreshed**

- One calm dark theme with a single gold accent, plain sentence-case labels and flat panels across every page
- Clearer lobby: Quick match up front, simple lobby cards, and empty states that tell you what to do next
- Cleaner board: clearer pieces and clocks, edge-to-edge on phones, and a calmer result screen with replay and review
- Readable leaderboard, profile, achievements and match history, with no sideways scrolling on phones
- New "How to play" guide with real pieces and a tap-to-try board
- New phone tab bar for Lobbies, Vs AI, Leaderboard, News and Chat
- New sign-in page and Season 3 welcome, built on the red and blue chevrons from the original 1981 box
- One typeface across the game: Poppins
- New footer: a giant "Generals" with the red and blue chevrons charging through the letters. Once you're signed in it shrinks to one row of links

**Pages with their own look**

- The lobby is a fight card: you on the blue side, your next opponent on the red, and every open lobby is a bout with an empty seat waiting for you
- Running a tournament? The top of the lobby now has a way to email us or send a ticket, and we'll help you host it here
- Vs AI: pick Recruit, Veteran or Commander from their portraits
- Game over is a title card: "Victory" or "Defeat" in your army's colour, with how the game ended
- The leaderboard puts the top three on a podium and groups everyone else by rank, with a bar showing how far you are from the next one
- Your profile shows your rank insignia, all seven ranks on the road to General, and your record
- News reads like a front page, with the newest story on top and older ones in columns
- Achievements are ribbons on a rack, and locked ones show how close you are
- New paintings for each page, and a new loading screen where the two armies meet

**Global chat, easier to follow**

- Messages from the same player in a row sit under one name, picture and time, so more of the conversation fits on screen
- Day dividers ("Today", "Yesterday") and clock times instead of "1h" on every line
- Reading older messages no longer yanks you to the bottom; a "2 new messages" button takes you back when you're ready
- "Show older messages" loads earlier chat
- Messages that mention you are highlighted
- Players without a picture get one of the built-in avatars, so they no longer all look the same

### 🐛 Fixes

- The tutorial no longer reopens on every page after you close it, and never covers the username screen
- Leaving the setup screen now warns you that it can cost you the game
- Draws no longer show a "You lost" message
- The leaderboard rank popup only shows when you actually reach a new best place
- The "Save your guest account" card no longer covers the board, and the upgrade card no longer shows to guests
- Failed chat and message sends now keep your text and let you retry
- On phones, the "Save your guest account" card no longer covers the chat box
- Mentions now work for every player, not only the first thousand who signed up
- The footer no longer jumps up and down between short and long pages
- Two combat achievements (Eliminator and Destroyer) were missing from the achievements page
- The online list in chat now shows only players who are actually here. Players who lost signal or closed the app used to stay "online" for good
- If your opponent loses signal or their app closes mid-game, they now show as disconnected and the 2-minute forfeit timer starts. Before, they could stay "online" and the timer never ran
- The app shows its loading screen right away instead of after a second of black on slow connections, and the loading screen is now the Season 3 title card. Pages that are loading show the board being set up

---

## [1.8.0] - 2025-11-XX

### 🔊 Immersive Audio Experience

**Dynamic Soundtrack**

- Background music that changes with your game - calm setup music when placing pieces, intense battle music during combat, and victory themes when you win
- Sound effects for every action: piece movements, battle clashes, match starting, leaderboard achievements, and game results
- Complete audio control with dedicated settings for background music and sound effects

### 🎨 Enhanced Visual Effects

**Victory Celebrations**

- Spectacular golden confetti explosions for victories that make winning feel epic
- Color-coordinated particle effects for both wins and honorable defeats
- Immersive visual feedback that celebrates every game outcome

**Smoother Interface**

- Faster, more responsive animations throughout the entire interface
- Snappier transitions and interactions that feel premium and polished

### 🌐 Better Social Features

**Enhanced Online Status**

- Improved online user tracking showing what games your friends are playing
- More accurate presence indicators for reliable social connections

---

## [1.7.0] - 2025-11-XX

### 🎮 Game Mode Revolution

**Three Distinct Game Modes**

- **Classic Mode**: Traditional 15-minute gameplay with standard Stratego rules
- **Blitz Mode**: Fast-paced action with 6 minutes per player for quick matches
- **Reveal Mode**: Winner's piece rank is revealed after each attack, adding strategic depth

**Enhanced Lobby Experience**

- Game mode selection when creating lobbies with visual mode indicators
- Clear mode badges showing Classic, Blitz, or Reveal for each game
- Intuitive game mode selector with descriptions and icons
- Mode-specific timer adjustments and gameplay expectations

**Strategic Variety**

- Choose your preferred pace and risk level for different gaming experiences
- Blitz mode perfect for rapid competitive play and quick decisions
- Reveal mode adds psychological depth with information revelation mechanics
- Classic mode maintains the traditional Stratego experience

### 🎨 Visual Enhancements

**Game Mode Integration**

- Mode badges displayed prominently in lobbies and during gameplay
- Color-coded indicators: Blue for Classic, Orange for Blitz, Purple for Reveal
- Enhanced game board showing current mode and time limits
- Improved lobby cards with mode information at a glance

### 🔧 Technical Foundation

**Game Mode Infrastructure**

- Complete game mode support across lobby creation and gameplay
- Dynamic timer systems adapting to selected game mode
- Enhanced database schema supporting mode-specific configurations
- Seamless mode transitions and state management

---

## [1.6.0] - 2025-01-XX

### 🎨 Enhanced Profile & Statistics

**Comprehensive Battle Statistics**

- Detailed battle stats display showing win streaks, play time, and performance metrics
- Fastest win and longest game tracking for competitive players
- Combat statistics including flags captured, pieces eliminated, and spies revealed
- Rank progress visualization with clear path to next rank
- Enhanced visual design with gradient icons and improved information hierarchy

**Leaderboard Improvements**

- Expanded player statistics with comprehensive performance breakdown
- Interactive player cards showing detailed metrics on demand
- Recent games history display for quick context
- Win rate visualization with circular progress indicators
- Better mobile responsiveness for expanded statistics view

**Profile Page Enhancements**

- Redesigned battle stats section with compact, information-dense layout
- Visual rank progress tracking with next rank indicators
- Improved stat cards with gradient backgrounds and icons
- Better organization of performance metrics
- Enhanced visual feedback for achievements and milestones

### 🔧 Technical Improvements

**Backend Enhancements**

- Enhanced profile statistics calculation and aggregation
- Improved data schema for extended player metrics
- Better performance tracking and analytics
- Optimized queries for leaderboard and profile data

**Database & Schema Updates**

- Extended profile statistics schema with new metrics
- Migration support for new statistics fields
- Improved data consistency and validation

---

## [1.6.1] - 2025-01-XX

### 🎯 Gameplay Rule Improvements

**Flag Base Win Condition - Aligned to Rulebook**

- Flag base win conditions now follow official rulebook specifications
- When player1's flag reaches player2's base, player2 gets one final turn to respond
- Player2 can now attack player1's flag if it reaches their base before the game ends
- When player2's flag reaches player1's base, the game ends immediately
- Ensures fair gameplay with equal move opportunities for both players

### ⚡ Performance & Stability Improvements

**Connection Reliability**

- Improved online status tracking with better error handling and automatic retry logic
- More stable presence system that handles network conflicts gracefully
- Reduced unnecessary network calls for better performance during gameplay
- Smoother online/offline status updates for players and spectators

**Chat Experience when Spectating**

- Fixed chat auto-scrolling that was interrupting typing in spectator mode
- Chat now stays in place when you're composing a message
- Smoother scrolling behavior that respects your reading position
- Better experience when chatting during live games

---

## [1.5.1] - 2025-11-XX

### 🎨 Enhanced User Interface

**Loading Experience**

- Unified loading spinner component for consistent visual feedback across all pages
- Improved loading state management with centralized reusable component
- Better user experience during page transitions and data loading

**Leaderboard Enhancements**

- Expandable player statistics showing detailed performance metrics
- Interactive player rows with toggle functionality for deeper insights
- Improved leaderboard navigation and information density

**Game Board Improvements**

- Real-time eliminated pieces tracker showing battle history
- Collapsible piece legend for better space management on smaller screens
- Enhanced battle outcome visualization with move-by-move tracking
- Improved visual hierarchy with expandable information sections

### 🔧 Technical Improvements

**Component Architecture**

- New ExpandableCard component for consistent interactive elements
- Outside click detection hook for better modal and dropdown behavior
- Centralized component library reducing code duplication
- Improved component reusability across the application

**Performance Optimizations**

- Memoized game moves processing for better performance
- Lazy loading optimizations for route components
- Reduced bundle size through component consolidation
- Enhanced state management efficiency

---

## [1.5.0] - 2025-11-XX

### ⚡ Quick Match System

**Instant Matchmaking**

- New Quick Match button for instant opponent pairing
- Skill-based matchmaking algorithm for fair and balanced games
- Real-time queue status with live countdown timer
- Automatic game start when opponents are found
- Queue timeout after 10 minutes for inactive players

**Queue Management**

- Visual queue status indicator showing search progress
- Cancel queue option at any time during matchmaking
- Automatic queue removal when joining lobbies manually
- Seamless transition from queue to game start

### 🎯 Enhanced User Experience

**Surrender Confirmation**

- Improved surrender dialog with clear confirmation prompt
- Better visual design with alert styling and icons
- Prevents accidental surrenders with explicit confirmation
- Consistent confirmation pattern across the application

### 🔧 Technical Improvements

**Performance & Stability**

- Updated core dependencies for better performance
- Enhanced matchmaking logic with skill rating calculations
- Improved lobby state management and queue cleanup
- Better error handling in matchmaking scenarios

---

## [1.4.2] - 2025-01-XX

### 🎯 Flag Battle Rules Enhancement

**Flag Behavior**

- Flags now strictly follow classic Stratego rules - they can only capture other flags
- Improved flag vs flag battles to be more predictable and fair
- Fixed situations where flags could incorrectly attack non-flag pieces
- Enhanced game end detection when flags are captured or reach enemy territory

### 🔧 Game Logic Refinements

**Battle Resolution**

- Cleaner battle outcomes with better win/loss determination
- More consistent behavior when pieces attack or defend
- Smoother gameplay experience with fewer edge case issues

---

## [1.4.1] - 2025-01-XX

### 🎮 AI Battle Improvements

**Flag Movement Fixes**

- Fixed a bug where flags couldn't properly attack other flags in AI battles
- Flags now correctly follow Stratego rules - they can only capture other flags, not other pieces
- Resolved "Flag cannot move to attack" error that was appearing during AI games

### 🔧 Technical Improvements

**Performance & Stability**

- Enhanced AI battle logic for smoother gameplay
- Improved error handling in game move validation
- Better game state management for complex battle scenarios

---

## [1.4.0] - Previous Version

_Previous version details available in git history_</contents>
</xai:function_call">The CHANGELOG.md file has been created successfully with a friendly user-focused changelog for version 1.4.1. The changelog highlights the key improvements made to AI battles while keeping a positive, accessible tone for users.
