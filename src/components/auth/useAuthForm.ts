import { useState, useEffect } from 'react';
import type { UserType } from '../../types';
import { AVATAR_PRESETS } from './constants';

/**
 * Owns all of the Auth screen's form state (login, registration and password
 * recovery) in one place. Returns every value + setter so the Auth component
 * and its sub-forms can share state without prop-drilling 40 fields.
 */
export function useAuthForm(defaultIsLogin?: boolean) {
  const [isLogin, setIsLogin] = useState<boolean>(defaultIsLogin ?? true);

  useEffect(() => {
    if (defaultIsLogin !== undefined) {
      setIsLogin(defaultIsLogin);
    }
  }, [defaultIsLogin]);

  // Registration / shared fields
  const [userType, setUserType] = useState<UserType>('operator');
  const [email, setEmail] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [firstName, setFirstName] = useState<string>('');
  const [companyName, setCompanyName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [selectedAvatar, setSelectedAvatar] = useState<string>(AVATAR_PRESETS[0]);
  const [bio, setBio] = useState<string>('');
  const [experienceYears, setExperienceYears] = useState<number | ''>(3);
  const [selectedMachines, setSelectedMachines] = useState<string[]>([]);
  const [customRegMachine, setCustomRegMachine] = useState<string>('');

  const [regPassword, setRegPassword] = useState<string>('');
  const [regConfirmPassword, setRegConfirmPassword] = useState<string>('');
  const [showRegPassword, setShowRegPassword] = useState<boolean>(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState<boolean>(false);

  // Password recovery
  const [isForgotMode, setIsForgotMode] = useState<boolean>(false);
  const [recoveryStep, setRecoveryStep] = useState<1 | 2>(1);
  const [forgotInput, setForgotInput] = useState<string>('');
  const [securityQ1, setSecurityQ1] = useState<string>('');
  const [securityQ2, setSecurityQ2] = useState<string>('');
  const [securityA1Input, setSecurityA1Input] = useState<string>('');
  const [securityA2Input, setSecurityA2Input] = useState<string>('');
  const [matchedUserObj, setMatchedUserObj] = useState<{ id: string } | null>(null);
  const [forgotNewPassword, setForgotNewPassword] = useState<string>('');
  const [forgotConfirmNewPassword, setForgotConfirmNewPassword] = useState<string>('');
  const [showForgotNewPassword, setShowForgotNewPassword] = useState<boolean>(false);
  const [showForgotConfirmNewPassword, setShowForgotConfirmNewPassword] = useState<boolean>(false);
  const [showLoginPassword, setShowLoginPassword] = useState<boolean>(false);

  // UI flags
  const [showTerms, setShowTerms] = useState<boolean>(false);
  const [showPrivacy, setShowPrivacy] = useState<boolean>(false);
  const [isAgreedToTerms, setIsAgreedToTerms] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
  const [hasOptimized, setHasOptimized] = useState<boolean>(false);
  const [originalBio, setOriginalBio] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  return {
    isLogin, setIsLogin,
    userType, setUserType,
    email, setEmail,
    lastName, setLastName,
    firstName, setFirstName,
    companyName, setCompanyName,
    phone, setPhone,
    password, setPassword,
    address, setAddress,
    selectedAvatar, setSelectedAvatar,
    bio, setBio,
    experienceYears, setExperienceYears,
    selectedMachines, setSelectedMachines,
    customRegMachine, setCustomRegMachine,
    regPassword, setRegPassword,
    regConfirmPassword, setRegConfirmPassword,
    showRegPassword, setShowRegPassword,
    showRegConfirmPassword, setShowRegConfirmPassword,
    isForgotMode, setIsForgotMode,
    recoveryStep, setRecoveryStep,
    forgotInput, setForgotInput,
    securityQ1, setSecurityQ1,
    securityQ2, setSecurityQ2,
    securityA1Input, setSecurityA1Input,
    securityA2Input, setSecurityA2Input,
    matchedUserObj, setMatchedUserObj,
    forgotNewPassword, setForgotNewPassword,
    forgotConfirmNewPassword, setForgotConfirmNewPassword,
    showForgotNewPassword, setShowForgotNewPassword,
    showForgotConfirmNewPassword, setShowForgotConfirmNewPassword,
    showLoginPassword, setShowLoginPassword,
    showTerms, setShowTerms,
    showPrivacy, setShowPrivacy,
    isAgreedToTerms, setIsAgreedToTerms,
    error, setError,
    successMsg, setSuccessMsg,
    isOptimizing, setIsOptimizing,
    hasOptimized, setHasOptimized,
    originalBio, setOriginalBio,
    isSubmitting, setIsSubmitting,
  };
}

export type AuthFormState = ReturnType<typeof useAuthForm>;
