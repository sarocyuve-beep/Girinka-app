import React from "react";
import { Alert, Pressable, Text } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import HomeScreen from "../screens/HomeScreen";
import SelectionCampaignListScreen from "../screens/selection/SelectionCampaignListScreen";
import SelectionCampaignFormScreen from "../screens/selection/SelectionCampaignFormScreen";
import CandidateListScreen from "../screens/selection/CandidateListScreen";
import CandidateFormScreen from "../screens/selection/CandidateFormScreen";
import CandidateDetailScreen from "../screens/selection/CandidateDetailScreen";
import BeneficiaryListScreen from "../screens/registry/BeneficiaryListScreen";
import BeneficiaryFormScreen from "../screens/registry/BeneficiaryFormScreen";
import BeneficiaryDetailScreen from "../screens/registry/BeneficiaryDetailScreen";
import DistributionFormScreen from "../screens/registry/DistributionFormScreen";
import DistributionListScreen from "../screens/registry/DistributionListScreen";
import IncidentFormScreen from "../screens/registry/IncidentFormScreen";
import IncidentListScreen from "../screens/registry/IncidentListScreen";
import FollowUpFormScreen from "../screens/registry/FollowUpFormScreen";
import FollowUpListScreen from "../screens/registry/FollowUpListScreen";
import PassOnFormScreen from "../screens/registry/PassOnFormScreen";
import PassOnListScreen from "../screens/registry/PassOnListScreen";
import PassOnAssessmentFormScreen from "../screens/registry/PassOnAssessmentFormScreen";
import ShedInspectionFormScreen from "../screens/registry/ShedInspectionFormScreen";
import ReportSelectionScreen from "../screens/reports/ReportSelectionScreen";
import WaitingListScreen from "../screens/selection/WaitingListScreen";
import PassOnAssessmentListScreen from "../screens/reports/PassOnAssessmentListScreen";
import ShedInspectionListScreen from "../screens/reports/ShedInspectionListScreen";
import AnimalListScreen from "../screens/animals/AnimalListScreen";
import AnimalFormScreen from "../screens/animals/AnimalFormScreen";
import CandidateAssessmentScreen from "../screens/selection/CandidateAssessmentScreen";
import CommitteeDecisionScreen from "../screens/selection/CommitteeDecisionScreen";
import AppealScreen from "../screens/selection/AppealScreen";
import ChangePasswordScreen from "../screens/ChangePasswordScreen";
import UserListScreen from "../screens/users/UserListScreen";
import UserFormScreen from "../screens/users/UserFormScreen";
import { t } from "../i18n/strings";
import { useAuth } from "../auth/AuthContext";

export type RootStackParamList = {
  Home: undefined;
  SelectionCampaigns: undefined;
  SelectionCampaignForm: undefined;
  CandidateList: { campaignId: string; campaignLabel: string };
  CandidateForm: { campaignId: string };
  CandidateDetail: { candidateId: string; fullName: string };
  CandidateAssessment: { candidateId: string; fullName: string };
  CommitteeDecision: { candidateId: string; fullName: string };
  Appeal: { candidateId: string; fullName: string };
  BeneficiaryList: undefined;
  BeneficiaryForm: undefined;
  BeneficiaryDetail: { beneficiaryId: string; fullName: string };
  DistributionForm: { beneficiaryId: string; candidateId?: string; distributionId?: string };
  DistributionList: undefined;
  IncidentForm: { beneficiaryId: string; animalId: string };
  IncidentList: undefined;
  FollowUpForm: { beneficiaryId: string; animalId: string };
  FollowUpList: undefined;
  PassOnForm: { donorId: string; animalId: string };
  PassOnList: undefined;
  PassOnAssessmentForm: { beneficiaryId: string; assessmentId?: string };
  PassOnAssessmentList: undefined;
  ShedInspectionForm: { beneficiaryId: string; inspectionId?: string };
  ShedInspectionList: undefined;
  ReportSelection: undefined;
  AnimalList: undefined;
  AnimalForm: { distributionId?: string; beneficiaryId?: string };
  UserList: undefined;
  UserForm: undefined;
  WaitingList: undefined;
  ChangePassword: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { signOut } = useAuth();
  const confirmSignOut = () =>
    Alert.alert(t("signOut"), t("signOutConfirm"), [
      { text: t("cancel"), style: "cancel" },
      { text: t("signOut"), style: "destructive", onPress: () => signOut() },
    ]);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: "#1b6e3c" }, headerTintColor: "white" }}>
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{
            title: t("appName"),
            headerRight: () => (
              <Pressable onPress={confirmSignOut} hitSlop={10}>
                <Text style={{ color: "white", fontWeight: "600" }}>{t("signOut")}</Text>
              </Pressable>
            ),
          }}
        />
        <Stack.Screen
          name="SelectionCampaigns"
          component={SelectionCampaignListScreen}
          options={{ title: t("campaigns") }}
        />
        <Stack.Screen
          name="SelectionCampaignForm"
          component={SelectionCampaignFormScreen}
          options={{ title: t("newCampaign") }}
        />
        <Stack.Screen
          name="CandidateList"
          component={CandidateListScreen}
          options={{ title: t("candidates") }}
        />
        <Stack.Screen
          name="CandidateForm"
          component={CandidateFormScreen}
          options={{ title: t("newCandidate") }}
        />
        <Stack.Screen
          name="CandidateDetail"
          component={CandidateDetailScreen}
          options={{ title: t("eligibilityChecklist") }}
        />
        <Stack.Screen
          name="BeneficiaryList"
          component={BeneficiaryListScreen}
          options={{ title: t("beneficiaries") }}
        />
        <Stack.Screen
          name="BeneficiaryForm"
          component={BeneficiaryFormScreen}
          options={{ title: "Kwandika Umugenerwabikorwa" }}
        />
        <Stack.Screen
          name="BeneficiaryDetail"
          component={BeneficiaryDetailScreen}
          options={({ route }) => ({ title: route.params.fullName })}
        />
        <Stack.Screen
          name="DistributionForm"
          component={DistributionFormScreen}
          options={{ title: "Guhaba Inka" }}
        />
        <Stack.Screen
          name="DistributionList"
          component={DistributionListScreen}
          options={{ title: t("distribution") }}
        />
        <Stack.Screen
          name="IncidentForm"
          component={IncidentFormScreen}
          options={{ title: "Kwandika Ikibazo" }}
        />
        <Stack.Screen
          name="IncidentList"
          component={IncidentListScreen}
          options={{ title: t("incidents") }}
        />
        <Stack.Screen
          name="FollowUpForm"
          component={FollowUpFormScreen}
          options={{ title: "Gusura inka" }}
        />
        <Stack.Screen
          name="FollowUpList"
          component={FollowUpListScreen}
          options={{ title: t("followUp") }}
        />
        <Stack.Screen
          name="PassOnForm"
          component={PassOnFormScreen}
          options={{ title: "Kwitura inka" }}
        />
        <Stack.Screen
          name="PassOnList"
          component={PassOnListScreen}
          options={{ title: t("kwitura") }}
        />
        <Stack.Screen
          name="PassOnAssessmentForm"
          component={PassOnAssessmentFormScreen}
          options={{ title: "Ibarura ry'inka yo kwiturwa" }}
        />
        <Stack.Screen
          name="PassOnAssessmentList"
          component={PassOnAssessmentListScreen}
          options={{ title: "Ifishi yo kubarura" }}
        />
        <Stack.Screen
          name="ShedInspectionForm"
          component={ShedInspectionFormScreen}
          options={{ title: "Isuzumwa ry'ikiraro" }}
        />
        <Stack.Screen
          name="ShedInspectionList"
          component={ShedInspectionListScreen}
          options={{ title: "Raporo y'Isuzumwa ry'Ibiraro" }}
        />
        <Stack.Screen
          name="ReportSelection"
          component={ReportSelectionScreen}
          options={{ title: t("reports") }}
        />
        <Stack.Screen
          name="AnimalList"
          component={AnimalListScreen}
          options={{ title: t("animals") }}
        />
        <Stack.Screen
          name="AnimalForm"
          component={AnimalFormScreen}
          options={{ title: "Inka nshya" }}
        />
        <Stack.Screen
          name="CandidateAssessment"
          component={CandidateAssessmentScreen}
          options={{ title: "Isuzuma (Assessment)" }}
        />
        <Stack.Screen
          name="CommitteeDecision"
          component={CommitteeDecisionScreen}
          options={{ title: "Icyemezo cya Komite" }}
        />
        <Stack.Screen
          name="Appeal"
          component={AppealScreen}
          options={{ title: "Kujurira (Appeal)" }}
        />
        <Stack.Screen name="UserList" component={UserListScreen} options={{ title: "Abakoresha" }} />
        <Stack.Screen name="UserForm" component={UserFormScreen} options={{ title: "Umukoresha mushya" }} />
        <Stack.Screen name="WaitingList" component={WaitingListScreen} options={{ title: "Abategereje Inka" }} />
        <Stack.Screen
          name="ChangePassword"
          component={ChangePasswordScreen}
          options={{ title: "Guhindura ijambobanga" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
