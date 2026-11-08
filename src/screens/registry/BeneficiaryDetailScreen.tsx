import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable, Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/RootNavigator";
import {
  getBeneficiary,
  listDistributionsForBeneficiary,
  listIncidentsForBeneficiary,
  listPassOnAssessmentsForBeneficiary,
  listShedInspectionsForBeneficiary,
  updateBeneficiary,
  deleteShedInspection,
  deletePassOnAssessment,
} from "../../db/registryRepository";
import { getAnimalById } from "../../db/animalRepository";
import { Beneficiary, Distribution, Incident, PassOnAssessment } from "../../types/registry";
import { Animal } from "../../types/animal";
import { useAuth, useCanWrite, useCanManageRegistry, useCanDeleteImportantData } from "../../auth/AuthContext";
import { deleteBeneficiary } from "../../db/registryRepository";

type Props = NativeStackScreenProps<RootStackParamList, "BeneficiaryDetail">;

export default function BeneficiaryDetailScreen({ route, navigation }: Props) {
  const { beneficiaryId } = route.params;
  const [beneficiary, setBeneficiary] = useState<Beneficiary | null>(null);
  const [distributions, setDistributions] = useState<Distribution[]>([]);
  const [animals, setAnimals] = useState<Record<string, Animal>>({});
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [assessments, setAssessments] = useState<PassOnAssessment[]>([]);
  const [inspections, setInspections] = useState<ShedInspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);

  const { profile } = useAuth();
  const writable = useCanWrite();
  const canManageRegistry = useCanManageRegistry();
  const canDeleteImportant = useCanDeleteImportantData();

  const loadData = useCallback(() => {
    let active = true;
    setLoading(true);
    Promise.all([
      getBeneficiary(beneficiaryId),
      listDistributionsForBeneficiary(beneficiaryId),
      listIncidentsForBeneficiary(beneficiaryId),
      listPassOnAssessmentsForBeneficiary(beneficiaryId),
      listShedInspectionsForBeneficiary(beneficiaryId),
    ]).then(async ([b, d, i, a, s]) => {
      if (!active) return;
      setBeneficiary(b);
      setDistributions(d);
      setIncidents(i);
      setAssessments(a);
      setInspections(s);

      const animalMap: Record<string, Animal> = {};
      for (const dist of d) {
        if (dist.animalId && !animalMap[dist.animalId]) {
          const animal = await getAnimalById(dist.animalId);
          if (animal) animalMap[dist.animalId] = animal;
        }
      }
      setAnimals(animalMap);
      setLoading(false);
    });
    return () => { active = false; };
  }, [beneficiaryId]);

  useFocusEffect(loadData);

  const handleDeleteBeneficiary = () => {
    Alert.alert(
      "Gusiba Umugenerwabikorwa",
      `Ese wizeye ko ushaka gusiba ${beneficiary?.fullName}? Ibi bizasiba n'amateka ye yose.`,
      [
        { text: "Hagarika", style: "cancel" },
        {
          text: "Yego, Siba",
          style: "destructive",
          onPress: async () => {
            await deleteBeneficiary(beneficiaryId);
            navigation.goBack();
          }
        }
      ]
    );
  };

  const handleEditBeneficiary = () => {
    if (beneficiary) {
      navigation.navigate("BeneficiaryForm", { beneficiary });
    }
  };

  const handleVerify = async (status: "HAS_COW" | "NO_COW" | "PASSED_ON") => {
    if (!beneficiary) return;

    setVerifying(true);
    try {
      await updateBeneficiary(beneficiary.id, {
        isVerified: true,
        verificationStatus: status,
        verificationDate: new Date().toISOString().split('T')[0],
        verifiedBy: profile?.fullName ?? "Field Officer",
      });
      loadData();
    } catch (e) {
      Alert.alert("Ikosa", "Ntibishoboye kwemezwa.");
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return <ActivityIndicator style={{ marginTop: 40 }} color="#1b6e3c" />;
  }

  if (!beneficiary) {
    return (
      <View style={styles.container}>
        <Text style={styles.empty}>Uyu muntu ntaboneste.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Verification Prompt for Village/Cell level */}
      {(!beneficiary.isVerified) ? (
        <View style={styles.verificationPrompt}>
          <Text style={styles.verificationTitle}>Kwememeza Amakuru y'ukuri (Field Verification)</Text>
          <Text style={styles.verificationText}>Emeza niba uyu mugenerwabikorwa afite inka cyangwa yarituye:</Text>
          <View style={styles.verificationActions}>
            <Pressable
              style={[styles.verifyBtn, { backgroundColor: '#1b6e3c' }]}
              onPress={() => handleVerify("HAS_COW")}
              disabled={verifying}
            >
              <Text style={styles.verifyBtnText}>Afite Inka</Text>
            </Pressable>
            <Pressable
              style={[styles.verifyBtn, { backgroundColor: '#005fb8' }]}
              onPress={() => handleVerify("PASSED_ON")}
              disabled={verifying}
            >
              <Text style={styles.verifyBtnText}>Yarituye</Text>
            </Pressable>
            <Pressable
              style={[styles.verifyBtn, { backgroundColor: '#b3261e' }]}
              onPress={() => handleVerify("NO_COW")}
              disabled={verifying}
            >
              <Text style={styles.verifyBtnText}>Nta nka afite</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={[styles.verificationPrompt, { backgroundColor: '#e8f5e9', borderColor: '#1b6e3c' }]}>
          <Text style={[styles.verificationTitle, { color: '#1b6e3c' }]}>✓ Byaremejwe kuri Field</Text>
          <Text style={styles.verificationText}>
            Ubusobanuro: {
              beneficiary.verificationStatus === "HAS_COW" ? "Afite inka" :
              beneficiary.verificationStatus === "PASSED_ON" ? "Yarituye" : "Nta nka afite"
            } (Kuwa {beneficiary.verificationDate})
          </Text>
        </View>
      )}

      <View style={styles.header}>
        <View>
          <Text style={styles.name}>{beneficiary.fullName}</Text>
          <Text style={styles.id}>{beneficiary.nationalId}</Text>
        </View>
        {canManageRegistry && (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable
              style={[styles.distributeBtn, { backgroundColor: '#005fb8' }]}
              onPress={handleEditBeneficiary}
            >
              <Text style={styles.distributeBtnText}>Hindura</Text>
            </Pressable>
            <Pressable
              style={styles.distributeBtn}
              onPress={() => navigation.navigate("DistributionForm", { beneficiaryId: beneficiary.id })}
            >
              <Text style={styles.distributeBtnText}>+ Guha inka</Text>
            </Pressable>
          </View>
        )}
      </View>

      <View style={styles.infoBlock}>
        <InfoRow label="Akarere" value={beneficiary.district} />
        <InfoRow label="Umurenge" value={beneficiary.sector} />
        <InfoRow label="Akagari" value={beneficiary.cell} />
        <InfoRow label="Umudugudu" value={beneficiary.village} />
        <InfoRow label="Icyiciro cy'Ubudehe" value={beneficiary.ubudeheCategory ?? "—"} />
        <InfoRow label="Telefone" value={beneficiary.phone ?? "—"} />
        <InfoRow label="Latitude" value={beneficiary.latitude?.toString() ?? "—"} />
        <InfoRow label="Longitude" value={beneficiary.longitude?.toString() ?? "—"} />
      </View>

      <Text style={styles.sectionTitle}>Amateka y'inka yahawe</Text>
      {distributions.length === 0 && (
        <Text style={styles.empty}>Nta nka irababoneka muri iyi register.</Text>
      )}
      {distributions.map((d) => (
        <View key={d.id} style={styles.distCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={styles.distYear}>{d.yearReceived}</Text>
            <View style={[styles.typeBadge, { backgroundColor: d.type === 'REPLACEMENT' ? '#d97706' : '#1b6e3c' }]}>
              <Text style={styles.typeBadgeText}>{d.type === 'REPLACEMENT' ? 'GUSHUMBUSHWA' : 'BWA MBERE'}</Text>
            </View>
          </View>
          <Text style={styles.distSub}>Inkomoko: {d.source}</Text>
          <Text style={[styles.distSub, { fontWeight: '700', color: d.passedOnCow ? '#1b6e3c' : '#d97706' }]}>
            Kwitura (Pass-on): {d.passedOnCow ? `YAKWITUYE (Tariki: ${d.passOnDate || '—'})` : "NTAKOZE (AGOMBA KWITURA)"}
          </Text>
          {d.passedOnCow && (
             <View style={[styles.verificationBadge, { backgroundColor: d.passOnVerificationStatus === 'VERIFIED' ? '#e8f5e9' : d.passOnVerificationStatus === 'REJECTED' ? '#fdecea' : '#fff3e0' }]}>
               <Text style={[styles.verificationBadgeText, { color: d.passOnVerificationStatus === 'VERIFIED' ? '#1b6e3c' : d.passOnVerificationStatus === 'REJECTED' ? '#b3261e' : '#e65100' }]}>
                 Status: {d.passOnVerificationStatus === 'VERIFIED' ? 'BYAREMEJWE N\'UBUGENZUZI' : d.passOnVerificationStatus === 'REJECTED' ? 'BYANZE (REJECTED)' : 'BITEGEREJE UBUGENZUZI (PENDING)'}
               </Text>
             </View>
          )}
          <Text style={styles.distSub}>
            Inka: {d.animalId && animals[d.animalId]
              ? `${animals[d.animalId].earTag} (${animals[d.animalId].breed}) - ${animals[d.animalId].color}`
              : 'Legacy (Ntabwo yanditswe muri sisitemu)'}
          </Text>
          {!d.animalId && canManageRegistry && (
            <Pressable
              style={styles.linkCowBtn}
              onPress={() => navigation.navigate("DistributionForm", { beneficiaryId: beneficiary.id, distributionId: d.id })}
            >
              <Text style={styles.linkCowBtnText}>+ Kwandika inka yahawe</Text>
            </Pressable>
          )}
          <Text style={styles.distSub}>No. y'itangwa: {d.id}</Text>

          {writable && (
            <View style={{ marginTop: 12, borderTopWidth: 1, borderTopColor: '#d1e5d5', paddingTop: 8 }}>
              {!d.passedOnCow && (
                 <Pressable
                   style={[styles.assessmentBtn]}
                   onPress={() => navigation.navigate("PassOnAssessmentForm", { beneficiaryId: beneficiary.id })}
                 >
                   <Text style={styles.assessmentBtnText}>Ibarura ry'inka yo kwiturwa</Text>
                 </Pressable>
              )}

              <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                <Pressable
                  style={[styles.actionBtn, { borderColor: '#b3261e' }]}
                  onPress={() => navigation.navigate("IncidentForm", {
                    beneficiaryId: beneficiary.id,
                    animalId: d.animalId || "LEGACY"
                  })}
                >
                  <Text style={[styles.actionBtnText, { color: '#b3261e' }]}>Ikibazo</Text>
                </Pressable>

                <Pressable
                  style={[styles.actionBtn, { borderColor: '#1b6e3c' }]}
                  onPress={() => navigation.navigate("FollowUpForm", {
                    beneficiaryId: beneficiary.id,
                    animalId: d.animalId || "LEGACY"
                  })}
                >
                  <Text style={[styles.actionBtnText, { color: '#1b6e3c' }]}>Ikurikirana</Text>
                </Pressable>

                {d.animalId && (
                  <Pressable
                    style={[styles.actionBtn, { borderColor: '#005fb8' }]}
                    onPress={() => navigation.navigate("PassOnForm", {
                      donorId: beneficiary.id,
                      animalId: d.animalId!
                    })}
                  >
                    <Text style={[styles.actionBtnText, { color: '#005fb8' }]}>Kwitura</Text>
                  </Pressable>
                )}

                <Pressable
                  style={[styles.actionBtn, { borderColor: '#673ab7' }]}
                  onPress={() => navigation.navigate("ShedInspectionForm", {
                    beneficiaryId: beneficiary.id
                  })}
                >
                  <Text style={[styles.actionBtnText, { color: '#673ab7' }]}>Ikiraro</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>
      ))}

      <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Ibarura ry'inka zo kwiturwa (Assessments)</Text>
      {assessments.length === 0 && (
        <Text style={styles.empty}>Nta barura rirakorwa.</Text>
      )}
      {assessments.map((a) => (
        <View key={a.id} style={styles.distCard}>
           <Text style={styles.distSub}>Ubwoko: {a.breed} | Igitsina: {a.sex}</Text>
           <Text style={styles.distSub}>Itariki yavutse: {a.birthDate} | Iherena: {a.earTag}</Text>
           <Text style={[styles.distSub, { fontWeight: '700', color: a.isReadyForPassOn ? '#1b6e3c' : '#d97706' }]}>
             Umwanzuro: {a.isReadyForPassOn ? "YAKWITURWA" : "NTIYAKWITURWA"}
           </Text>
           <Text style={styles.distSub}>{a.conclusion}</Text>

           {canManageRegistry && (
             <View style={{ flexDirection: 'row', gap: 8, marginTop: 8, borderTopWidth: 0.5, borderTopColor: '#ccc', paddingTop: 8 }}>
                <Pressable
                  onPress={() => navigation.navigate("PassOnAssessmentForm", { beneficiaryId: beneficiary.id, assessmentId: a.id })}
                  style={{ flex: 1, alignItems: 'center' }}
                >
                   <Text style={{ color: '#005fb8', fontSize: 12, fontWeight: '600' }}>Hindura</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    Alert.alert("Gusiba", "Ese ushaka gusiba iri barura?", [
                      { text: "Hagarika" },
                      { text: "Siba", style: 'destructive', onPress: async () => {
                        await deletePassOnAssessment(a.id);
                        loadData();
                      }}
                    ]);
                  }}
                  style={{ flex: 1, alignItems: 'center' }}
                >
                   <Text style={{ color: '#b3261e', fontSize: 12, fontWeight: '600' }}>Siba</Text>
                </Pressable>
             </View>
           )}
        </View>
      ))}

      <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Isuzumwa ry'ibiraro (Shed Inspections)</Text>
      {inspections.length === 0 && (
        <Text style={styles.empty}>Nta suzumwa ry'ikiraro rirakorwa.</Text>
      )}
      {inspections.map((s) => (
        <View key={s.id} style={styles.distCard}>
           <Text style={styles.distSub}>Ikiraro: {s.hasShed ? "KIRAHARI" : "NTAKIRIHO"} | Gikomeye: {s.isFirm ? "YEGO" : "OYA"}</Text>
           <Text style={styles.distSub}>Gisakaye: {s.isRoofed ? "YEGO" : "OYA"} | Sima: {s.hasCement ? "YEGO" : "OYA"}</Text>
           <Text style={[styles.distSub, { fontWeight: '700', color: s.conclusion === 'READY' ? '#1b6e3c' : '#d97706' }]}>
             Umwanzuro: {s.conclusion}
           </Text>
           {s.improvementNotes && <Text style={styles.distSub}>Icyo yanoza: {s.improvementNotes}</Text>}

           {canManageRegistry && (
             <View style={{ flexDirection: 'row', gap: 8, marginTop: 8, borderTopWidth: 0.5, borderTopColor: '#ccc', paddingTop: 8 }}>
                <Pressable
                  onPress={() => navigation.navigate("ShedInspectionForm", { beneficiaryId: beneficiary.id, inspectionId: s.id })}
                  style={{ flex: 1, alignItems: 'center' }}
                >
                   <Text style={{ color: '#005fb8', fontSize: 12, fontWeight: '600' }}>Hindura</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    Alert.alert("Gusiba", "Ese ushaka gusiba iri suzumwa?", [
                      { text: "Hagarika" },
                      { text: "Siba", style: 'destructive', onPress: async () => {
                        await deleteShedInspection(s.id);
                        loadData();
                      }}
                    ]);
                  }}
                  style={{ flex: 1, alignItems: 'center' }}
                >
                   <Text style={{ color: '#b3261e', fontSize: 12, fontWeight: '600' }}>Siba</Text>
                </Pressable>
             </View>
           )}
        </View>
      ))}

      <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Ibibazo byabaye (Incidents)</Text>
      {incidents.length === 0 && (
        <Text style={styles.empty}>Nta bibazo byigeze byandikwa.</Text>
      )}
      {incidents.map((i) => (
        <View key={i.id} style={styles.incidentCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={styles.incidentType}>{i.type}</Text>
            <Text style={styles.incidentDate}>{i.date}</Text>
          </View>
          <Text style={styles.incidentDesc}>{i.description}</Text>
          <Text style={styles.incidentMeta}>Yanditswe na: {i.reportedBy}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  name: { fontSize: 20, fontWeight: "700" },
  id: { fontSize: 13, color: "#666" },
  distributeBtn: { backgroundColor: "#1b6e3c", paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  distributeBtnText: { color: "white", fontWeight: "700", fontSize: 14 },
  infoBlock: {
    backgroundColor: "#f2f4f2",
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  infoRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  infoLabel: { color: "#666", fontSize: 13 },
  infoValue: { fontWeight: "600", fontSize: 13 },
  sectionTitle: { fontSize: 15, fontWeight: "700", marginBottom: 10 },
  empty: { textAlign: "center", color: "#666", marginTop: 12 },
  distCard: {
    backgroundColor: "#eaf3ec",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  distYear: { fontSize: 16, fontWeight: "700", color: "#1b6e3c" },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    justifyContent: 'center',
  },
  typeBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
  },
  distSub: { fontSize: 12, color: "#444", marginTop: 2 },
  actionBtn: {
    flex: 1,
    borderWidth: 1,
    padding: 6,
    borderRadius: 6,
    alignItems: 'center',
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '600',
  },
  assessmentBtn: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#1b6e3c',
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 4,
  },
  assessmentBtnText: {
    color: '#1b6e3c',
    fontSize: 12,
    fontWeight: '700',
  },
  linkCowBtn: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d97706',
    padding: 6,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 4,
  },
  linkCowBtnText: {
    color: '#d97706',
    fontSize: 11,
    fontWeight: '700',
  },
  incidentCard: {
    backgroundColor: "#fdecea",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#b3261e',
  },
  incidentType: { fontWeight: '700', color: '#b3261e', fontSize: 13 },
  incidentDate: { fontSize: 12, color: '#666' },
  incidentDesc: { fontSize: 13, marginTop: 4, color: '#333' },
  incidentMeta: { fontSize: 11, color: '#888', marginTop: 6 },
  verificationBadge: {
    marginTop: 4,
    padding: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  verificationBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  verificationPrompt: {
    backgroundColor: '#fff3e0',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ffb74d',
  },
  verificationTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#e65100',
    marginBottom: 8,
  },
  verificationText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 12,
  },
  verificationActions: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  verifyBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  verifyBtnText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 13,
  },
});
