import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import type { FollowUpSpecialty, SuggestedFollowUp } from "@/types/vitalpilot";
import { Button, ui } from "./ui";

const labels: Record<FollowUpSpecialty, string> = {
  primary_care: "Find primary care",
  cardiology: "Find a cardiologist",
  pulmonology: "Find a pulmonologist",
  endocrinology: "Find an endocrinologist",
};

export function SuggestedFollowUpCard({
  followUp,
  beforeNavigate,
}: {
  followUp?: SuggestedFollowUp | null;
  beforeNavigate?: () => void;
}) {
  const router = useRouter();
  if (!followUp) return null;
  const openProviders = (specialty: FollowUpSpecialty) => {
    beforeNavigate?.();
    router.push({
      pathname: "/doctors",
      params: {
        specialty_group: specialty,
        reason: "suggested-follow-up",
        follow_up_explanation: followUp.explanation,
      },
    });
  };
  return (
    <View style={{ gap: 12, marginTop: 12 }}>
      <Text accessibilityRole="header" style={ui.heading}>
        Suggested follow-up
      </Text>
      <Text style={ui.body}>{followUp.explanation}</Text>
      {followUp.primary_specialty_group && (
        <Button
          onPress={() => openProviders(followUp.primary_specialty_group!)}
        >
          {labels[followUp.primary_specialty_group]}
        </Button>
      )}
      {followUp.alternative_specialty_groups.map((specialty) => (
        <Button
          key={specialty}
          secondary
          onPress={() => openProviders(specialty)}
        >
          {labels[specialty]}
        </Button>
      ))}
    </View>
  );
}
