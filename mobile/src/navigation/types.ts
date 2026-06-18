export type RootStackParamList = {
  Auth: undefined;
  TenantTabs: undefined;
  LandlordTabs: undefined;
  ListingDetail: { listingId: string };
  ChatScreen: { conversationId: string; listingId?: string; landlordId?: string };
  PaymentScreen: { agreementId: string; amount: number };
  ReceiptScreen: { paymentId: string };
  Profile: undefined;
  KycScreen: undefined;
  Services: undefined;
  Feedback: undefined;
  RentalHistory: undefined;
  Settings: undefined;
  TenantLookup: undefined;
};

export type AuthStackParamList = {
  Welcome: undefined;
  SignIn: { intendedRole?: "tenant" | "landlord" };
  SignUp: { intendedRole?: "tenant" | "landlord" };
  Onboarding: undefined;
};

export type TenantTabParamList = {
  HomeTab: undefined;
  FavoritesTab: undefined;
  MessagesTab: undefined;
  ProfileTab: undefined;
};

export type LandlordTabParamList = {
  DashboardTab: undefined;
  MyListingsTab: undefined;
  MessagesTab: undefined;
  ProfileTab: undefined;
};
