'use client';

import { useState, useEffect, useRef, useCallback, startTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, User, Palette, Globe, Shield, Coins, Camera, Trash2, Upload } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslations, useI18nContext } from '@/lib/i18n/context';
import { Locale } from '@/lib/i18n/config';
import { toast } from 'sonner';
import { updateProfile, updatePreferences, changePassword, setPassword, getUserProfile } from '@/lib/server/profile';
import { uploadAvatar, deleteAvatar } from '@/lib/server/avatar';
import { Currency, Theme } from '@prisma/client';
import { useTheme } from 'next-themes';
import { PageTransition } from '@/components/shared/animations';
import { PasswordRequirements } from '@/components/shared/password-requirements';

const profileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
});

// Password validation: 8+ chars, uppercase, lowercase, special char
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]).{8,}$/;

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(passwordRegex, 'Password must contain uppercase, lowercase, and special character'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

const setPasswordSchema = z.object({
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(passwordRegex, 'Password must contain uppercase, lowercase, and special character'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;
type SetPasswordFormData = z.infer<typeof setPasswordSchema>;

interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  avatarPublicUrl: string | null;
  baseCurrency: Currency;
  theme: Theme;
  accentColor: string;
  locale: string;
  createdAt: Date;
  isOAuthUser: boolean;
  hasPassword: boolean;
}

const ACCENT_COLORS = [
  { name: 'blue', color: 'hsl(221.2 83.2% 53.3%)' },
  { name: 'emerald', color: 'hsl(142.1 76.2% 36.3%)' },
  { name: 'violet', color: 'hsl(262.1 83.3% 57.8%)' },
  { name: 'rose', color: 'hsl(346.8 77.2% 49.8%)' },
  { name: 'amber', color: 'hsl(43.3 96.4% 56.3%)' },
  { name: 'coral', color: 'hsl(0 84% 60%)' },
] as const;

export default function ProfilePage() {
  const t = useTranslations('profile');
  const { locale: currentLocale, setLocale: setI18nLocale } = useI18nContext();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isDeletingAvatar, setIsDeletingAvatar] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preferences state
  const [selectedTheme, setSelectedTheme] = useState<Theme>(Theme.SYSTEM);
  const [accentColor, setAccentColor] = useState('blue');
  const [locale, setLocale] = useState<Locale>(currentLocale);
  const [baseCurrency, setBaseCurrency] = useState<Currency>(Currency.CRC);
  
  // next-themes hook for applying theme changes
  const { setTheme: applyTheme } = useTheme();

  // Apply theme immediately when changed
  const handleThemeChange = (value: Theme) => {
    setSelectedTheme(value);
    // Apply immediately for responsive UX
    applyTheme(value.toLowerCase());
  };

  // Apply accent color immediately when changed
  const handleAccentColorChange = (color: string) => {
    setAccentColor(color);
    // Apply immediately for responsive UX
    document.documentElement.setAttribute('data-accent', color);
    localStorage.setItem('accent-color', color);
  };

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: '' },
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const setPasswordForm = useForm<SetPasswordFormData>({
    resolver: zodResolver(setPasswordSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  });

  const loadProfile = useCallback(async () => {
    startTransition(() => setIsLoading(true));
    const profile = await getUserProfile();
    if (profile) {
      startTransition(() => {
        setUser(profile as UserProfile);
        profileForm.reset({ name: profile.name || '' });
        setSelectedTheme(profile.theme);
        setAccentColor(profile.accentColor);
        setLocale(profile.locale as Locale);
        setBaseCurrency(profile.baseCurrency);
      });
    }
    startTransition(() => setIsLoading(false));
  }, [profileForm]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const onProfileSubmit = async (data: ProfileFormData) => {
    setIsSavingProfile(true);
    const result = await updateProfile(data);
    if (result.success) {
      toast.success(t('profileUpdated'));
      loadProfile();
    } else {
      toast.error(result.error);
    }
    setIsSavingProfile(false);
  };

  const onPreferencesSubmit = async () => {
    setIsSavingPreferences(true);
    const result = await updatePreferences({
      theme: selectedTheme,
      accentColor: accentColor as 'blue' | 'emerald' | 'violet' | 'rose' | 'amber' | 'coral',
      locale: locale as 'en' | 'es',
      baseCurrency,
    });
    if (result.success) {
      toast.success(t('preferencesUpdated'));
      // Theme and accent color are already applied immediately via handlers
      // Apply locale change immediately via I18n context
      if (locale !== currentLocale) {
        setI18nLocale(locale as Locale);
      }
      loadProfile();
    } else {
      toast.error(result.error);
    }
    setIsSavingPreferences(false);
  };

  const onPasswordSubmit = async (data: PasswordFormData) => {
    setIsSavingPassword(true);
    const result = await changePassword(data);
    if (result.success) {
      toast.success(t('passwordChanged'));
      passwordForm.reset();
    } else {
      toast.error(result.error);
    }
    setIsSavingPassword(false);
  };

  const onSetPasswordSubmit = async (data: SetPasswordFormData) => {
    setIsSavingPassword(true);
    const result = await setPassword(data);
    if (result.success) {
      toast.success(t('passwordSet'));
      setPasswordForm.reset();
      loadProfile(); // Reload to update hasPassword status
    } else {
      toast.error(result.error);
    }
    setIsSavingPassword(false);
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    const formData = new FormData();
    formData.append('avatar', file);

    const result = await uploadAvatar(formData);
    if (result.success) {
      toast.success(t('avatarUploaded'));
      loadProfile();
    } else {
      toast.error(result.error || t('avatarUploadError'));
    }
    setIsUploadingAvatar(false);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAvatarDelete = async () => {
    setIsDeletingAvatar(true);
    const result = await deleteAvatar();
    if (result.success) {
      toast.success(t('avatarRemoved'));
      loadProfile();
    } else {
      toast.error(result.error || t('avatarUploadError'));
    }
    setIsDeletingAvatar(false);
  };

  const getUserInitials = () => {
    if (user?.name) {
      return user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return user?.email?.[0]?.toUpperCase() || 'U';
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div>
          <Skeleton className="h-9 w-48" />
          <Skeleton className="mt-2 h-5 w-72" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <PageTransition className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground">{t('description')}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Picture */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-muted-foreground" />
              <CardTitle>{t('avatar')}</CardTitle>
            </div>
            <CardDescription>{t('avatarDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center gap-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={user.avatarPublicUrl || undefined} alt={user.name || 'Profile'} />
                <AvatarFallback className="text-2xl">{getUserInitials()}</AvatarFallback>
              </Avatar>
              
              <div className="flex flex-wrap gap-2 justify-center">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarUpload}
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="hidden"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                >
                  {isUploadingAvatar ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="mr-2 h-4 w-4" />
                  )}
                  {user.avatarPublicUrl ? t('changeAvatar') : t('uploadAvatar')}
                </Button>
                
                {user.avatarPublicUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAvatarDelete}
                    disabled={isDeletingAvatar}
                    className="text-destructive hover:text-destructive"
                  >
                    {isDeletingAvatar ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="mr-2 h-4 w-4" />
                    )}
                    {t('removeAvatar')}
                  </Button>
                )}
              </div>
              
              <div className="text-center text-xs text-muted-foreground">
                <p>{t('maxFileSize')}</p>
                <p>{t('allowedFormats')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-muted-foreground" />
              <CardTitle>{t('accountInfo')}</CardTitle>
            </div>
            <CardDescription>{t('accountInfoDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t('name')}</Label>
                <Input
                  id="name"
                  placeholder={t('namePlaceholder')}
                  {...profileForm.register('name')}
                />
                {profileForm.formState.errors.name && (
                  <p className="text-sm text-destructive">
                    {profileForm.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t('email')}</Label>
                <Input
                  id="email"
                  value={user.email}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">{t('emailReadonly')}</p>
              </div>

              <div className="space-y-2">
                <Label>{t('memberSince')}</Label>
                <p className="text-sm text-muted-foreground">
                  {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>

              <Button type="submit" disabled={isSavingProfile}>
                {isSavingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('updateProfile')}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-muted-foreground" />
              <CardTitle>{t('appearance')}</CardTitle>
            </div>
            <CardDescription>{t('appearanceDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label>{t('theme')}</Label>
              <p className="text-xs text-muted-foreground">{t('themeDesc')}</p>
              <ToggleGroup
                type="single"
                value={selectedTheme}
                onValueChange={(value) => value && handleThemeChange(value as Theme)}
                className="justify-start"
              >
                <ToggleGroupItem value="LIGHT" aria-label="Light">
                  {t('light')}
                </ToggleGroupItem>
                <ToggleGroupItem value="DARK" aria-label="Dark">
                  {t('dark')}
                </ToggleGroupItem>
                <ToggleGroupItem value="SYSTEM" aria-label="System">
                  {t('system')}
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            <Separator />

            <div className="space-y-3">
              <Label>{t('accentColor')}</Label>
              <p className="text-xs text-muted-foreground">{t('accentColorDesc')}</p>
              <div className="flex flex-wrap gap-2">
                {ACCENT_COLORS.map((color) => (
                  <button
                    key={color.name}
                    type="button"
                    onClick={() => handleAccentColorChange(color.name)}
                    className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${
                      accentColor === color.name
                        ? 'border-foreground scale-110'
                        : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: color.color }}
                    title={t(color.name)}
                  >
                    {accentColor === color.name && (
                      <span className="text-white text-lg">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <Button onClick={onPreferencesSubmit} disabled={isSavingPreferences} className="w-full">
              {isSavingPreferences && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('updatePreferences')}
            </Button>
          </CardContent>
        </Card>

        {/* Language & Currency */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-muted-foreground" />
              <CardTitle>{t('language')}</CardTitle>
            </div>
            <CardDescription>{t('languageDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>{t('language')}</Label>
              <Select value={locale} onValueChange={(v) => setLocale(v as Locale)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">{t('english')}</SelectItem>
                  <SelectItem value="es">{t('spanish')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="flex items-center gap-2 mb-2">
              <Coins className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold">{t('currencyPreferences')}</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">{t('currencyPreferencesDesc')}</p>

            <div className="space-y-2">
              <Label>{t('baseCurrency')}</Label>
              <p className="text-xs text-muted-foreground">{t('baseCurrencyDesc')}</p>
              <Select value={baseCurrency} onValueChange={(v) => setBaseCurrency(v as Currency)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CRC">₡ CRC - Colones</SelectItem>
                  <SelectItem value="USD">$ USD - Dollars</SelectItem>
                  <SelectItem value="CAD">CA$ CAD - Canadian Dollars</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={onPreferencesSubmit} disabled={isSavingPreferences} className="w-full">
              {isSavingPreferences && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('updatePreferences')}
            </Button>
          </CardContent>
        </Card>

        {/* Security */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <CardTitle>{t('security')}</CardTitle>
            </div>
            <CardDescription>
              {user?.hasPassword ? t('securityDesc') : t('setPasswordDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {user?.hasPassword ? (
              /* Change Password Form - for users who already have a password */
              <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">{t('currentPassword')}</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    {...passwordForm.register('currentPassword')}
                  />
                  {passwordForm.formState.errors.currentPassword && (
                    <p className="text-sm text-destructive">
                      {passwordForm.formState.errors.currentPassword.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">{t('newPassword')}</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    {...passwordForm.register('newPassword')}
                  />
                  <PasswordRequirements password={passwordForm.watch('newPassword') || ''} className="mt-2" />
                  {passwordForm.formState.errors.newPassword && (
                    <p className="text-sm text-destructive">
                      {passwordForm.formState.errors.newPassword.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">{t('confirmPassword')}</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    {...passwordForm.register('confirmPassword')}
                  />
                  {passwordForm.formState.errors.confirmPassword && (
                    <p className="text-sm text-destructive">
                      {passwordForm.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <Button type="submit" disabled={isSavingPassword}>
                  {isSavingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t('updatePassword')}
                </Button>
              </form>
            ) : (
              /* Set Password Form - for OAuth users who don't have a password yet */
              <form onSubmit={setPasswordForm.handleSubmit(onSetPasswordSubmit)} className="space-y-4 max-w-md">
                <p className="text-sm text-muted-foreground mb-4">
                  {t('setPasswordHint')}
                </p>
                
                <div className="space-y-2">
                  <Label htmlFor="setNewPassword">{t('newPassword')}</Label>
                  <Input
                    id="setNewPassword"
                    type="password"
                    {...setPasswordForm.register('newPassword')}
                  />
                  <PasswordRequirements password={setPasswordForm.watch('newPassword') || ''} className="mt-2" />
                  {setPasswordForm.formState.errors.newPassword && (
                    <p className="text-sm text-destructive">
                      {setPasswordForm.formState.errors.newPassword.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="setConfirmPassword">{t('confirmPassword')}</Label>
                  <Input
                    id="setConfirmPassword"
                    type="password"
                    {...setPasswordForm.register('confirmPassword')}
                  />
                  {setPasswordForm.formState.errors.confirmPassword && (
                    <p className="text-sm text-destructive">
                      {setPasswordForm.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <Button type="submit" disabled={isSavingPassword}>
                  {isSavingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t('setPassword')}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
