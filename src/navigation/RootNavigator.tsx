import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from '../screens/HomeScreen';
import SelectionCampaignListScreen from '../screens/selection/SelectionCampaignListScreen';
import SelectionCampaignFormScreen from '../screens/selection/SelectionCampaignFormScreen';
import BeneficiaryListScreen from '../screens/registry/BeneficiaryListScreen';
import BeneficiaryDetailScreen from '../screens/registry/BeneficiaryDetailScreen';

export type RootStackParamList = {
  Home: undefined;
  SelectionCampaignList: undefined;
  SelectionCampaignForm: undefined;
  BeneficiaryList: undefined;
  BeneficiaryDetail: { beneficiaryId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'GirinkaApp' }} />
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}
