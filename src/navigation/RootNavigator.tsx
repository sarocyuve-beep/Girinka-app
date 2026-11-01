import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import AuthScreen from '../screens/AuthScreen';
import HomeScreen from '../screens/HomeScreen';
import SelectionCampaignListScreen from '../screens/selection/SelectionCampaignListScreen';
import SelectionCampaignFormScreen from '../screens/selection/SelectionCampaignFormScreen';
import BeneficiaryListScreen from '../screens/registry/BeneficiaryListScreen';
import BeneficiaryDetailScreen from '../screens/registry/BeneficiaryDetailScreen';
import BeneficiaryFormScreen from '../screens/registry/BeneficiaryFormScreen';
import ReportsScreen from '../screens/ReportsScreen';
import AnimalListScreen from '../screens/AnimalListScreen';
import AnimalFormScreen from '../screens/AnimalFormScreen';
import FollowUpListScreen from '../screens/FollowUpListScreen';
import FollowUpFormScreen from '../screens/FollowUpFormScreen';
import DocumentUploadScreen from '../screens/DocumentUploadScreen';

export type RootStackParamList = {
  Auth: undefined;
  Home: {
    userName?: string;
    role?: string;
    district?: string;
    sector?: string;
    cell?: string;
    village?: string;
  };
  SelectionCampaignList: undefined;
  SelectionCampaignForm: undefined;
  BeneficiaryList: undefined;
  BeneficiaryDetail: { beneficiaryId: string };
  BeneficiaryForm: undefined;
  Reports: undefined;
  AnimalList: { beneficiaryId: string };
  AnimalForm: { beneficiaryId: string };
  FollowUpList: { beneficiaryId: string };
  FollowUpForm: { beneficiaryId: string };
  DocumentUpload: { beneficiaryId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Auth">
        <Stack.Screen name="Auth" component={AuthScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Home' }} />

        <Stack.Screen
          name="SelectionCampaignList"
          component={SelectionCampaignListScreen}
          options={{ title: 'Selection campaigns' }}
        />
        <Stack.Screen
          name="SelectionCampaignForm"
          component={SelectionCampaignFormScreen}
          options={{ title: 'New campaign' }}
        />

        <Stack.Screen
          name="BeneficiaryList"
          component={BeneficiaryListScreen}
          options={{ title: 'Beneficiary registry' }}
        />
        <Stack.Screen
          name="BeneficiaryDetail"
          component={BeneficiaryDetailScreen}
          options={{ title: 'Beneficiary detail' }}
        />
        <Stack.Screen
          name="BeneficiaryForm"
          component={BeneficiaryFormScreen}
          options={{ title: 'New beneficiary' }}
        />

        <Stack.Screen
          name="Reports"
          component={ReportsScreen}
          options={{ title: 'Reports' }}
        />

        <Stack.Screen
          name="AnimalList"
          component={AnimalListScreen}
          options={{ title: 'Livestock records' }}
        />
        <Stack.Screen
          name="AnimalForm"
          component={AnimalFormScreen}
          options={{ title: 'Register animal' }}
        />

        <Stack.Screen
          name="FollowUpList"
          component={FollowUpListScreen}
          options={{ title: 'Follow-up records' }}
        />
        <Stack.Screen
          name="FollowUpForm"
          component={FollowUpFormScreen}
          options={{ title: 'Add follow-up' }}
        />

        <Stack.Screen
          name="DocumentUpload"
          component={DocumentUploadScreen}
          options={{ title: 'Upload document' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
