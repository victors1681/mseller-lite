import React from "react";
import { StyleSheet, View } from "react-native";
import { ProgressBar, Text, useTheme } from "react-native-paper";

interface ProgressHeaderProps {
  totalProductos: number;
  productosPreparados: number;
  noRuta: string;
}

const ProgressHeader: React.FC<ProgressHeaderProps> = ({
  totalProductos,
  productosPreparados,
  noRuta,
}) => {
  const theme = useTheme();
  const progress =
    totalProductos > 0 ? productosPreparados / totalProductos : 0;
  const isComplete = productosPreparados === totalProductos && totalProductos > 0;

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.surface }]}
    >
      <View style={styles.headerRow}>
        <Text variant="titleMedium" style={{ color: theme.colors.primary }}>
          📦 {noRuta}
        </Text>
        <Text
          variant="titleMedium"
          style={{
            color: isComplete ? "#388E3C" : theme.colors.onSurface,
            fontWeight: "bold",
          }}
        >
          {productosPreparados} / {totalProductos}
        </Text>
      </View>
      <ProgressBar
        progress={progress}
        color={isComplete ? "#388E3C" : theme.colors.primary}
        style={styles.progressBar}
      />
      <Text
        variant="bodySmall"
        style={{ color: theme.colors.onSurfaceVariant, textAlign: "center" }}
      >
        {isComplete
          ? "✅ Preparación completa"
          : `${Math.round(progress * 100)}% completado`}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  progressBar: {
    height: 10,
    borderRadius: 5,
    marginBottom: 6,
  },
});

export default ProgressHeader;
