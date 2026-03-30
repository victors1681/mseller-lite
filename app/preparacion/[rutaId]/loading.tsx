import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ActivityIndicator,
  Button,
  Card,
  Chip,
  Divider,
  Icon,
  ProgressBar,
  Snackbar,
  Text,
  useTheme,
} from "react-native-paper";
import { useTranslation } from "@/hooks/useTranslation";
import { preparacionService } from "../../../services/preparacionService";
import { CargaCliente, CargaResponse } from "../../../types/preparacion";

export default function LoadingScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { rutaId } = useLocalSearchParams<{ rutaId: string }>();
  const numericRutaId = parseInt(rutaId ?? "0", 10);

  const [data, setData] = useState<CargaResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [confirmingClient, setConfirmingClient] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadCarga = useCallback(async () => {
    try {
      setError("");
      const response = await preparacionService.getCarga(numericRutaId);
      setData(response);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
      setError(
        axiosErr.response?.data?.message ||
          axiosErr.message ||
          t("preparacion.errorLoadingCarga")
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [numericRutaId, t]);

  useEffect(() => {
    loadCarga();
  }, [loadCarga]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadCarga();
  }, [loadCarga]);

  const handleConfirmLoad = async (codigoCliente: string) => {
    try {
      setConfirmingClient(codigoCliente);
      setError("");
      const response = await preparacionService.confirmarCarga(numericRutaId, codigoCliente);
      // Update local state to mark client as confirmed
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          clientes: prev.clientes.map((c) =>
            c.codigoCliente === codigoCliente
              ? { ...c, confirmado: true }
              : c
          ),
        };
      });

      if (response.rutaDespachada) {
        setSuccess(t("preparacion.routeDispatched"));
      } else {
        setSuccess(t("preparacion.clientLoaded"));
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
      setError(
        axiosErr.response?.data?.message || t("preparacion.errorConfirmingLoad")
      );
    } finally {
      setConfirmingClient(null);
    }
  };

  // Sort clients in LIFO order (reverse delivery sequence — last delivery first)
  const sortedClients = [...(data?.clientes ?? [])].sort(
    (a, b) => b.secuenciaEntrega - a.secuenciaEntrega
  );

  const totalClients = sortedClients.length;
  const loadedClients = sortedClients.filter((c) => c.confirmado).length;
  const allLoaded = totalClients > 0 && loadedClients === totalClients;
  const progress = totalClients > 0 ? loadedClients / totalClients : 0;

  const nextUnloadedClientCodigo = sortedClients.find((c) => !c.confirmado)?.codigoCliente ?? null;

  const renderClientCard = ({ item }: { item: CargaCliente }) => {
    const isConfirming = confirmingClient === item.codigoCliente;
    const isNextToLoad = nextUnloadedClientCodigo === item.codigoCliente;

    return (
      <Card
        style={[
          styles.clientCard,
          {
            backgroundColor: theme.colors.surface,
            borderLeftColor: item.confirmado ? "#388E3C" : isNextToLoad ? theme.colors.primary : "#9E9E9E",
            opacity: item.confirmado ? 0.7 : 1,
          },
        ]}
      >
        <Card.Content>
          {/* Client header */}
          <View style={styles.clientHeader}>
            <View style={styles.clientInfo}>
              <View style={styles.clientNameRow}>
                <Text
                  variant="titleMedium"
                  style={{ fontWeight: "bold", color: theme.colors.onSurface }}
                  numberOfLines={1}
                >
                  {item.nombreCliente}
                </Text>
                {item.confirmado && (
                  <Icon source="check-circle" size={22} color="#388E3C" />
                )}
              </View>
              <Text
                variant="bodySmall"
                style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}
              >
                {item.codigoCliente}
              </Text>
            </View>
            <View style={styles.clientMeta}>
              <Chip
                style={{
                  backgroundColor: item.confirmado ? "#E8F5E9" : "#FFF3E0",
                }}
                textStyle={{
                  color: item.confirmado ? "#388E3C" : "#F57C00",
                  fontSize: 11,
                }}
                compact
                icon={item.confirmado ? "check" : "clock-outline"}
              >
                {item.confirmado
                  ? t("preparacion.loaded")
                  : t("preparacion.pending")}
              </Chip>
            </View>
          </View>

          {/* Delivery sequence indicator */}
          <View style={styles.deliveryRow}>
            <Icon
              source="truck-delivery"
              size={16}
              color={theme.colors.onSurfaceVariant}
            />
            <Text
              variant="bodySmall"
              style={{ color: theme.colors.onSurfaceVariant, marginLeft: 6 }}
            >
              {t("preparacion.deliveryOrder")} #{item.secuenciaEntrega} ·{" "}
              {item.totalBultos} {t("preparacion.packages")}
            </Text>
          </View>

          <Divider style={styles.cardDivider} />

          {/* Product list */}
          {item.productos.map((prod, idx) => (
            <View key={`${prod.codigoProducto}-${idx}`} style={styles.productRow}>
              <View style={styles.productInfo}>
                <Text
                  variant="bodyMedium"
                  style={{ color: theme.colors.onSurface }}
                  numberOfLines={1}
                >
                  {prod.descripcion}
                </Text>
                <Text
                  variant="bodySmall"
                  style={{ color: theme.colors.onSurfaceVariant }}
                >
                  {prod.codigoProducto}
                </Text>
              </View>
              <Text
                style={[styles.productQty, { color: theme.colors.onSurface }]}
              >
                {prod.cantidad}{" "}
                <Text
                  variant="bodySmall"
                  style={{ color: theme.colors.onSurfaceVariant }}
                >
                  {prod.unidad}
                </Text>
              </Text>
            </View>
          ))}

          {/* Confirm button */}
          {!item.confirmado && (
            <Button
              mode="contained"
              onPress={() => handleConfirmLoad(item.codigoCliente)}
              disabled={isConfirming || !isNextToLoad}
              loading={isConfirming}
              icon="truck-check"
              style={styles.confirmButton}
              contentStyle={styles.confirmButtonContent}
            >
              {t("preparacion.confirmLoad")}
            </Button>
          )}
        </Card.Content>
      </Card>
    );
  };

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
          {t("preparacion.loadingData")}
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={["top", "left", "right"]}
    >
      {/* Navigation bar */}
      <View style={styles.navBar}>
        <Button
          icon="arrow-left"
          onPress={() => router.back()}
          mode="text"
          compact
          style={styles.navButton}
          contentStyle={styles.navButtonContent}
        >
          {t("common.back")}
        </Button>
      </View>

      {/* Header */}
      <View style={styles.header}>
        <Text
          variant="headlineSmall"
          style={{ fontWeight: "bold", color: theme.colors.onBackground }}
        >
          🚛 {t("preparacion.loadingTitle")}
        </Text>
        <Text
          variant="bodyMedium"
          style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}
        >
          {data?.noRuta ?? `Ruta ${rutaId}`} ·{" "}
          {t("preparacion.loadingSubtitle")}
        </Text>
      </View>

      {/* Progress bar */}
      <View
        style={[
          styles.progressContainer,
          { backgroundColor: theme.colors.surface },
        ]}
      >
        <View style={styles.progressTextRow}>
          <Text
            variant="bodyLarge"
            style={{
              fontWeight: "bold",
              color: allLoaded ? "#388E3C" : theme.colors.onSurface,
            }}
          >
            {allLoaded
              ? `✅ ${t("preparacion.allClientsLoaded")}`
              : t("preparacion.loadingProgress", {
                  loaded: loadedClients,
                  total: totalClients,
                })}
          </Text>
        </View>
        <ProgressBar
          progress={progress}
          color={allLoaded ? "#388E3C" : theme.colors.primary}
          style={styles.progressBar}
        />
      </View>

      {/* Client list */}
      <FlatList
        data={sortedClients}
        keyExtractor={(item) => item.codigoCliente}
        renderItem={renderClientCard}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      <Snackbar
        visible={!!error}
        onDismiss={() => setError("")}
        duration={4000}
        action={{
          label: t("common.retry"),
          onPress: () => {
            setError("");
            loadCarga();
          },
        }}
      >
        {error}
      </Snackbar>

      <Snackbar
        visible={!!success}
        onDismiss={() => setSuccess("")}
        duration={2000}
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
  navButton: {
    minHeight: 48,
  },
  navButtonContent: {
    minHeight: 48,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  progressContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  progressTextRow: {
    marginBottom: 8,
  },
  progressBar: {
    height: 10,
    borderRadius: 5,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  separator: {
    height: 12,
  },
  clientCard: {
    borderRadius: 12,
    borderLeftWidth: 4,
    elevation: 2,
  },
  clientHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  clientInfo: {
    flex: 1,
    marginRight: 8,
  },
  clientNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  clientMeta: {
    alignItems: "flex-end",
  },
  deliveryRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  cardDivider: {
    marginVertical: 10,
  },
  productRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    minHeight: 48,
  },
  productInfo: {
    flex: 1,
    marginRight: 12,
  },
  productQty: {
    fontSize: 20,
    fontWeight: "900",
  },
  confirmButton: {
    marginTop: 12,
    minHeight: 48,
  },
  confirmButtonContent: {
    minHeight: 48,
  },
});
