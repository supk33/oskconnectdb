import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, getIdTokenResult } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

const AuthContext = createContext();

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: true
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'SET_USER':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: !!action.payload.user,
        loading: false
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false
      };
    default:
      return state;
  }
};

const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Listen to Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('Firebase Auth state changed:', !!firebaseUser);
      
      if (!firebaseUser) {
        dispatch({
          type: 'SET_USER',
          payload: { user: null, token: null }
        });
        return;
      }

      try {
        // Get ID token
        const tokenResult = await getIdTokenResult(firebaseUser, true);
        
        // Get user data from Firestore
        let userData = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          firstName: firebaseUser.displayName?.split(' ')[0] || firebaseUser.email?.split('@')[0] || 'User',
          lastName: firebaseUser.displayName?.split(' ').slice(1).join(' ') || '',
          role: 'member', // default role
          ...firebaseUser
        };

        // Manual admin role assignment for development
        if (firebaseUser.email === 'admin@oskconnect.com') {
          userData.role = 'admin';
          console.log('Manual admin role assigned for:', firebaseUser.email);
        }

        // Try to get user data from Firestore
        try {
          console.log('Fetching user from Firestore with UID:', firebaseUser.uid);
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const firestoreData = userDoc.data();
            userData = {
              ...userData,
              ...firestoreData,
              // Ensure these fields are always present
              uid: firebaseUser.uid,
              email: firebaseUser.email || firestoreData.email,
              role: firestoreData.role || 'visitor',    // ถ้าไม่มีข้อมูลให้เป็น visitor
              userType: firestoreData.userType || 'visitor',  // ประเภทผู้ใช้: visitor, member, admin
              status: firestoreData.status || 'active',     // visitor จะมีสถานะ active เสมอ
              generation: firestoreData.generation
            };
            console.log('User data from Firestore:', userData);
          } else {
            console.log('No user document found in Firestore for UID:', firebaseUser.uid);
            console.log('Using default data with role: member');
          }
        } catch (firestoreError) {
          console.error('Error fetching user from Firestore:', firestoreError);
          // Continue with default user data
        }

        dispatch({
          type: 'SET_USER',
          payload: { user: userData, token: tokenResult.token }
        });
        
      } catch (error) {
        console.error('Error in auth state change:', error);
        dispatch({
          type: 'SET_USER',
          payload: { user: null, token: null }
        });
      }
    });

    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const register = async ({ email, password, firstName, lastName, generation }) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Create user in Firebase Auth
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Add user data to Firestore with member role and pending status
      const userRef = doc(db, 'users', result.user.uid);
      await setDoc(userRef, {
        firstName,
        lastName,
        generation,
        email,
        role: 'member',        // เป็นสมาชิกแต่ต้องรอการอนุมัติ
        status: 'pending',     // สถานะรอการอนุมัติ
        canAddShops: false,    // ยังไม่สามารถเพิ่มร้านค้าได้จนกว่าจะได้รับการอนุมัติ
        createdAt: serverTimestamp()
      });

      return { success: true };
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      dispatch({ type: 'LOGOUT' });
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const value = {
    ...state,
    login,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export { AuthProvider };
export default AuthContext;