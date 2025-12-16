# When Do You Need `useCallback`?

## Scenario Analysis

### ❌ Current Hook: Functions ARE exported + Used in useEffect

```tsx
// Functions ARE exported (returned from hook)
return {
  subscribe,    // ✅ Exported - consumers use this
  unsubscribe,  // ✅ Exported - consumers use this
  connect,      // ✅ Exported - consumers use this
  disconnect,   // ✅ Exported - consumers use this
};

// Functions ARE used in useEffect
useEffect(() => {
  connect();    // ✅ Used in useEffect
  return () => disconnect(); // ✅ Used in useEffect
}, []); // Empty deps, but functions are stable due to useCallback
```

**Result: NEED useCallback** ✅
- Functions are exported → consumers might use them in their useEffect
- Functions are used in useEffect → need stable references
- handleMessage assigned to WebSocket → needs stable reference

---

## Scenario 1: Functions NOT exported + NOT used in useEffect

```tsx
function useExample() {
  const [count, setCount] = useState(0);
  
  // ❌ NOT exported, NOT used in useEffect
  const increment = () => {
    setCount(c => c + 1);
  };
  
  // ❌ NOT exported, NOT used in useEffect  
  const decrement = () => {
    setCount(c => c - 1);
  };
  
  // Only return state, not functions
  return { count }; // Functions not exported!
  
  // No useEffect using these functions
}
```

**Result: DON'T need useCallback** ❌
- Functions are never exported
- Functions are never used in useEffect dependencies
- Functions are only used internally
- **Just use regular functions!**

```tsx
// ✅ Simple version - no useCallback needed
const increment = () => setCount(c => c + 1);
const decrement = () => setCount(c => c - 1);
```

---

## Scenario 2: Functions NOT exported + Used in useEffect WITH empty deps

```tsx
function useExample() {
  const [count, setCount] = useState(0);
  
  // ❌ NOT exported, but used in useEffect
  const increment = () => {
    setCount(c => c + 1);
  };
  
  useEffect(() => {
    increment(); // Used here
  }, []); // Empty deps - runs once
  
  return { count }; // Function not exported
}
```

**Result: DON'T need useCallback** ❌
- Function is not exported
- useEffect has empty deps `[]` → runs once
- Function is recreated every render, but useEffect only runs once
- **No problem!** The function reference doesn't matter

```tsx
// ✅ This works fine without useCallback
const increment = () => setCount(c => c + 1);

useEffect(() => {
  increment(); // Called once, doesn't matter if increment changes
}, []); // Empty deps = runs once
```

---

## Scenario 3: Functions NOT exported + Used in useEffect WITH function in deps

```tsx
function useExample() {
  const [count, setCount] = useState(0);
  
  // ❌ NOT exported, but used in useEffect deps
  const increment = () => {
    setCount(c => c + 1);
  };
  
  useEffect(() => {
    console.log('Increment function changed');
  }, [increment]); // ❌ increment in deps!
  
  return { count }; // Function not exported
}
```

**Result: NEED useCallback** ✅
- Function is in useEffect dependency array
- Without useCallback: increment changes every render → infinite loop!
- With useCallback: increment stays stable → useEffect runs once

```tsx
// ✅ NEED useCallback here
const increment = useCallback(() => {
  setCount(c => c + 1);
}, []); // Empty deps = never changes

useEffect(() => {
  console.log('Increment function changed');
}, [increment]); // Now increment is stable
```

---

## Scenario 4: Functions ARE exported + NOT used in useEffect

```tsx
function useExample() {
  const [count, setCount] = useState(0);
  
  // ✅ Exported, but NOT used in useEffect
  const increment = () => {
    setCount(c => c + 1);
  };
  
  return { count, increment }; // Function exported!
  
  // No useEffect using increment
}
```

**Result: NEED useCallback** ✅ (usually)
- Function is exported → consumers might use it in their useEffect
- If consumer does `useEffect(() => {}, [increment])` → needs stable reference
- **Best practice: use useCallback for exported functions**

```tsx
// ✅ Use useCallback for exported functions
const increment = useCallback(() => {
  setCount(c => c + 1);
}, []);

return { count, increment };
```

**BUT** if you're 100% sure consumers won't use it in useEffect:
```tsx
// ⚠️ Risky - only if you're sure consumers won't use in useEffect
const increment = () => setCount(c => c + 1);
```

---

## Scenario 5: Functions assigned to event handlers (like WebSocket)

```tsx
function useWebSocket() {
  const handleMessage = (event) => {
    console.log(event.data);
  };
  
  useEffect(() => {
    const ws = new WebSocket('ws://...');
    ws.onmessage = handleMessage; // ✅ Assigned to event handler
    
    return () => ws.close();
  }, []); // Empty deps
}
```

**Result: NEED useCallback** ✅
- Event handler is assigned once, but handleMessage changes every render
- WebSocket keeps OLD handleMessage reference → stale closure!
- With useCallback: handleMessage stays stable → WebSocket uses latest version

```tsx
// ✅ NEED useCallback for event handlers
const handleMessage = useCallback((event) => {
  console.log(event.data);
}, []); // Dependencies if needed

useEffect(() => {
  const ws = new WebSocket('ws://...');
  ws.onmessage = handleMessage; // Stable reference
  return () => ws.close();
}, [handleMessage]); // Include in deps
```

---

## Summary Table

| Scenario | Exported? | Used in useEffect? | Event Handler? | Need useCallback? |
|----------|-----------|-------------------|---------------|------------------|
| Internal helper | ❌ | ❌ | ❌ | ❌ **NO** |
| Used in useEffect (empty deps) | ❌ | ✅ (empty deps) | ❌ | ❌ **NO** |
| Used in useEffect (in deps) | ❌ | ✅ (in deps) | ❌ | ✅ **YES** |
| Exported function | ✅ | ❌ | ❌ | ✅ **YES** (best practice) |
| Event handler | ❌ | ❌ | ✅ | ✅ **YES** |
| Current hook | ✅ | ✅ | ✅ | ✅ **YES** |

---

## Your Current Hook Analysis

```tsx
// ✅ Functions ARE exported
return { subscribe, unsubscribe, connect, disconnect, getPrice };

// ✅ Functions ARE used in useEffect
useEffect(() => {
  connect();    // Used here
  return () => disconnect();
}, []);

// ✅ handleMessage assigned to WebSocket event handler
ws.onmessage = handleMessage;
```

**Conclusion: You NEED useCallback for ALL of these!** ✅

If you removed exports and useEffect usage:
- ❌ Still need useCallback for `handleMessage` (WebSocket event handler)
- ❌ Could remove useCallback for others (but they're exported, so keep them)

