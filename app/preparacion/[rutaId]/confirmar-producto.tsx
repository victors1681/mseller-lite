import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Snackbar, useTheme } from "react-native-paper";
import DistributionForm from "../../../components/preparacion/DistributionForm";
import { preparacionService } from "../../../services/preparacionService";
import { ConsolidadoDistribucion } from "../../../types/preparacion";

export default function ConfirmarProductoScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{
    rutaId: string;
    codigoProducto: string;
    descripcion: string;
    cantidadTotal: string;
    unidad: string;
    distribucion: string;
  }>();

  const rutaId = parseInt(params.rutaId ?? "0", 10);
  const cantidadTotal = parseInt(params.cantidadTotal ?? "0", 10);
  const distribucionClientes: ConsolidadoDistribucion[] = (() => {
    try {
      return JSON.parse(params.distribucion ?? "[]");
    } catch {
      return [];
    }
  })();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleConfirm = async (
    cantidadPreparada: number,
    distribucion: { codigoCliente: string; cantidad: number }[],
    observacion?: string
  ) => {
    try {
      setLoading(true);
      setError("");
      await preparacionService.confirmarProducto({
        rutaId,
        codigoProducto: params.codigoProducto ?? "",
        cantidadTotal: cantidadPreparada,
        distribucion,
        observacion,
      });
      router.back();
    } catch (err: any) {
      console.error("Error confirming product:", err);
      setError(
        err.response?.data?.message || "Error al confirmar producto"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={["top", "left", "right"]}
    >
      <DistributionForm
        codigoProducto={params.codigoProducto ?? ""}
        descripcion={params.descripcion ?? ""}
        cantidadTotal={cantidadTotal}
        distribucionClientes={distribucionClientes}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        loading={loading}
      />

      <Snackbar
        visible={!!error}
        onDismiss={() => setError("")}
        duration={4000}
      >
        {error}
      </Snackbar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
