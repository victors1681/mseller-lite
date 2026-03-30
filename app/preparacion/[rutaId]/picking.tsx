import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { RefreshControl, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ActivityIndicator,
  Button,
  Snackbar,
  Text,
  useTheme,
} from "react-native-paper";
import ProgressHeader from "../../../components/preparacion/ProgressHeader";
import ZoneProductList from "../../../components/preparacion/ZoneProductList";
import { preparacionService } from "../../../services/preparacionService";
import {
  ConsolidadoProducto,
  ConsolidadoResponse,
} from "../../../types/preparacion";

export default function PickingScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { rutaId } = useLocalSearchParams<{ rutaId: string }>();
  const numericRutaId = parseInt(rutaId ?? "0", 10);

  const [data, setData] = useState<ConsolidadoResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadConsolidado = useCallback(async () => {
    try {
      setError("");
      const response =
        await preparacionService.getConsolidado(numericRutaId);
      setData(response);
    } catch (err: any) {
      console.error("Error loading consolidado:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Error al cargar datos de preparación"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [numericRutaId]);

  useEffect(() => {
    loadConsolidado();
  }, [loadConsolidado]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadConsolidado();
  }, [loadConsolidado]);

  const handleProductPress = (producto: ConsolidadoProducto) => {
    if (producto.cantidadPreparada >= producto.cantidadTotal) return;
    router.push({
      pathname: "/preparacion/[rutaId]/confirmar-producto" as any,
      params: {
        rutaId: rutaId ?? "0",
        codigoProducto: producto.codigoProducto,
        descripcion: producto.descripcion,
        cantidadTotal: producto.cantidadTotal.toString(),
        unidad: producto.unidad,
        clientes: JSON.stringify(producto.clientes),
      },
    });
  };

  const handleCompletarPreparacion = async () => {
    try {
      setCompleting(true);
      await preparacionService.completarPreparacion(numericRutaId);
      setSuccess("Preparación completada exitosamente");
      setTimeout(() => router.back(), 1500);
    } catch (err: any) {
      console.error("Error completing preparacion:", err);
      setError(
        err.response?.data?.message || "Error al completar preparación"
      );
    } finally {
      setCompleting(false);
    }
  };

  // Compute totals across all zones
  const totalProductos =
    data?.zonas.reduce((sum, z) => sum + z.productos.length, 0) ?? 0;
  const productosPreparados =
    data?.zonas.reduce(
      (sum, z) =>
        sum +
        z.productos.filter((p) => p.cantidadPreparada >= p.cantidadTotal)
          .length,
      0
    ) ?? 0;
  const allConfirmed =
    totalProductos > 0 && productosPreparados === totalProductos;

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.centered, { backgroundColor: theme.colors.background }]}
      >
        <ActivityIndicator size="large" />
        <Text
          variant="bodyLarge"
          style={{ marginTop: 16, color: theme.colors.onSurfaceVariant }}
        >
          Cargando picking...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={["top", "left", "right"]}
    >
      {/* Back button */}
      <View style={styles.navBar}>
        <Button
          icon="arrow-left"
          onPress={() => router.back()}
          mode="text"
          compact
          style={styles.backButton}
          contentStyle={styles.backButtonContent}
        >
          Preparación
        </Button>
      </View>

      {/* Zone-grouped picking list */}
      <ZoneProductList
        zonas={data?.zonas ?? []}
        onProductPress={handleProductPress}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListHeaderComponent={
          <ProgressHeader
            totalProductos={totalProductos}
            productosPreparados={productosPreparados}
            noRuta={data?.noRuta ?? `Ruta ${rutaId}`}
          />
        }
      />

      {/* Bottom fixed action bar */}
      <View
        style={[
          styles.bottomBar,
          { backgroundColor: theme.colors.surface, borderTopColor: "#E0E0E0" },
        ]}
      >
        <Button
          mode="contained"
          onPress={handleCompletarPreparacion}
          disabled={!allConfirmed || completing}
          loading={completing}
          icon="check-all"
          style={styles.completeButton}
          contentStyle={styles.completeButtonContent}
        >
          Completar Preparación
        </Button>
      </View>

      <Snackbar
        visible={!!error}
        onDismiss={() => setError("")}
        duration={4000}
        action={{
          label: "Reintentar",
          onPress: () => {
            setError("");
            loadConsolidado();
          },
        }}
      >
        {error}
      </Snackbar>

      <Snackbar
        visible={!!success}
        onDismiss={() => setSuccess("")}
        duration={3000}
      >
        {success}
      </Snackbar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 4,
    minHeight: 48,
  },
  backButton: {
    minHeight: 48,
  },
  backButtonContent: {
    minHeight: 48,
  },
  bottomBar: {
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
  },
  completeButton: {
    minHeight: 48,
  },
  completeButtonContent: {
    minHeight: 48,
  },
});
