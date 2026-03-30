import { useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ActivityIndicator,
  Button,
  Card,
  Checkbox,
  Chip,
  Divider,
  Icon,
  IconButton,
  ProgressBar,
  Snackbar,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";
import { useTranslation } from "@/hooks/useTranslation";
import { preparacionService } from "../../../services/preparacionService";
import { CargaCliente, CargaResponse, ItemCargaConfirmacion } from "../../../types/preparacion";

export default function LoadingScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const { rutaId } = useLocalSearchParams<{ rutaId: string }>();
  const numericRutaId = parseInt(rutaId ?? "0", 10);

  const [data, setData] = useState<CargaResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [confirmingClient, setConfirmingClient] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Expandable card state
  const [expandedId, setExpandedId] = useState<number | null>(null);
  // Item-level quantities: { [rutaDetalleId]: { [codigoProducto]: qty } }
  const [itemQtys, setItemQtys] = useState<Record<number, Record<string, number>>>({});
  // Item-level check state: { [rutaDetalleId]: Set<codigoProducto> }
  const [checkedItems, setCheckedItems] = useState<Record<number, Set<string>>>({});

  const loadCarga = useCallback(async () => {
    try {
      setError("");
      const response = await preparacionService.getCarga(numericRutaId);
      setData(response);
      // Initialize item quantities and checked state from response
      const qtys: Record<number, Record<string, number>> = {};
      const checks: Record<number, Set<string>> = {};
      for (const c of response.clientes ?? []) {
        qtys[c.rutaDetalleId] = {};
        checks[c.rutaDetalleId] = new Set();
        for (const p of c.productos ?? []) {
          qtys[c.rutaDetalleId][p.codigoProducto] = p.cantidad;
        }
      }
      setItemQtys(qtys);
      setCheckedItems(checks);
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

  const toggleExpand = (rutaDetalleId: number) => {
    setExpandedId((prev) => (prev === rutaDetalleId ? null : rutaDetalleId));
  };

  const handleItemQtyChange = (rutaDetalleId: number, codigoProducto: string, qty: number) => {
    setItemQtys((prev) => ({
      ...prev,
      [rutaDetalleId]: { ...prev[rutaDetalleId], [codigoProducto]: Math.max(0, qty) },
    }));
  };

  const toggleItemCheck = (rutaDetalleId: number, codigoProducto: string) => {
    setCheckedItems((prev) => {
      const current = new Set(prev[rutaDetalleId] ?? []);
      if (current.has(codigoProducto)) {
        current.delete(codigoProducto);
      } else {
        current.add(codigoProducto);
      }
      return { ...prev, [rutaDetalleId]: current };
    });
  };

  const allItemsChecked = (item: CargaCliente): boolean => {
    const checked = checkedItems[item.rutaDetalleId];
    if (!checked) return false;
    return (item.productos ?? []).every((p) => checked.has(p.codigoProducto));
  };

  const handleConfirmLoad = async (item: CargaCliente) => {
    try {
      setConfirmingClient(item.rutaDetalleId);
      setError("");

      // Build item-level data
      const items: ItemCargaConfirmacion[] = (item.productos ?? []).map((p) => ({
        codigoProducto: p.codigoProducto,
        cantidadCargada: itemQtys[item.rutaDetalleId]?.[p.codigoProducto] ?? p.cantidad,
      }));

      const response = await preparacionService.confirmarCarga(numericRutaId, item.rutaDetalleId, items);

      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          clientes: prev.clientes.map((c) =>
            c.rutaDetalleId === item.rutaDetalleId ? { ...c, confirmado: true } : c
          ),
        };
      });
      setExpandedId(null);

      if (response.rutaDespachada) {
        setSuccess(
          response.noTransporte
            ? `${t("preparacion.routeDispatched")} — ${response.noTransporte}`
            : t("preparacion.routeDispatched")
        );
      } else {
        setSuccess(t("preparacion.clientLoaded"));
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
      setError(axiosErr.response?.data?.message || t("preparacion.errorConfirmingLoad"));
    } finally {
      setConfirmingClient(null);
    }
  };

  const sortedClients = [...(data?.clientes ?? [])].sort(
    (a, b) => b.secuenciaEntrega - a.secuenciaEntrega
  );

  const totalClients = sortedClients.length;
  const loadedClients = sortedClients.filter((c) => c.confirmado).length;
  const allLoaded = totalClients > 0 && loadedClients === totalClients;
  const progress = totalClients > 0 ? loadedClients / totalClients : 0;

  const renderClientCard = ({ item }: { item: CargaCliente }) => {
    const isConfirming = confirmingClient === item.rutaDetalleId;
    const isExpanded = expandedId === item.rutaDetalleId;
    const productos = item.productos ?? [];

    return (
      <Card
        style={[
          styles.clientCard,
          {
            backgroundColor: theme.colors.surface,
            borderLeftColor: item.confirmado ? "#388E3C" : theme.colors.primary,
            opacity: item.confirmado ? 0.7 : 1,
          },
        ]}
      >
        <Pressable onPress={() => !item.confirmado && toggleExpand(item.rutaDetalleId)}>
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

            {/* Delivery info */}
            <View style={styles.deliveryRow}>
              <Icon source="truck-delivery" size={16} color={theme.colors.onSurfaceVariant} />
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginLeft: 6 }}>
                {t("preparacion.deliveryOrder")} #{item.secuenciaEntrega} · {productos.length} {t("preparacion.items")}
              </Text>
              {!item.confirmado && (
                <Icon
                  source={isExpanded ? "chevron-up" : "chevron-down"}
                  size={20}
                  color={theme.colors.onSurfaceVariant}
                />
              )}
            </View>
          </Card.Content>
        </Pressable>

        {/* Expanded item-level confirmation */}
        {isExpanded && !item.confirmado && (
          <Card.Content style={{ paddingTop: 0 }}>
            <Divider style={styles.cardDivider} />

            {productos.map((prod, idx) => {
              const checked = checkedItems[item.rutaDetalleId]?.has(prod.codigoProducto) ?? false;
              const qty = itemQtys[item.rutaDetalleId]?.[prod.codigoProducto] ?? prod.cantidad;

              return (
                <View key={`${prod.codigoProducto}-${idx}`} style={styles.itemRow}>
                  <Checkbox
                    status={checked ? "checked" : "unchecked"}
                    onPress={() => toggleItemCheck(item.rutaDetalleId, prod.codigoProducto)}
                    color={theme.colors.primary}
                  />
                  <View style={styles.itemInfo}>
                    <Text
                      variant="bodyMedium"
                      style={{ color: theme.colors.onSurface }}
                      numberOfLines={1}
                    >
                      {prod.descripcion}
                    </Text>
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      {prod.codigoProducto} · {prod.unidad}
                    </Text>
                  </View>
                  <View style={styles.stepper}>
                    <IconButton
                      icon="minus"
                      size={18}
                      onPress={() => handleItemQtyChange(item.rutaDetalleId, prod.codigoProducto, qty - 1)}
                      style={styles.stepperBtn}
                    />
                    <TextInput
                      value={String(qty)}
                      onChangeText={(v) => {
                        const n = parseInt(v, 10);
                        if (!isNaN(n)) handleItemQtyChange(item.rutaDetalleId, prod.codigoProducto, n);
                      }}
                      keyboardType="numeric"
                      style={styles.stepperInput}
                      dense
                      mode="outlined"
                    />
                    <IconButton
                      icon="plus"
                      size={18}
                      onPress={() => handleItemQtyChange(item.rutaDetalleId, prod.codigoProducto, qty + 1)}
                      style={styles.stepperBtn}
                    />
                  </View>
                </View>
              );
            })}

            <Button
              mode="contained"
              onPress={() => handleConfirmLoad(item)}
              disabled={isConfirming || !allItemsChecked(item)}
              loading={isConfirming}
              icon="truck-check"
              style={styles.confirmButton}
              contentStyle={styles.confirmButtonContent}
            >
              {t("preparacion.confirmLoad")}
            </Button>
          </Card.Content>
        )}
      </Card>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" />
        <Text variant="bodyLarge" style={{ marginTop: 16, color: theme.colors.onSurfaceVariant }}>
          {t("preparacion.loadingData")}
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={["left", "right"]}
    >
      <View style={[styles.progressContainer, { backgroundColor: theme.colors.surface }]}>
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

      <FlatList
        data={sortedClients}
        keyExtractor={(item) => String(item.rutaDetalleId ?? `${item.codigoCliente}-${item.secuenciaEntrega}`)}
        renderItem={renderClientCard}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      <Snackbar visible={!!error} onDismiss={() => setError("")} duration={4000}
        action={{ label: t("common.retry"), onPress: () => { setError(""); loadCarga(); } }}>
        {error}
      </Snackbar>

      <Snackbar visible={!!success} onDismiss={() => setSuccess("")} duration={2000}>
        {success}
      </Snackbar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  progressContainer: {
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: "#E0E0E0",
  },
  progressTextRow: { marginBottom: 8 },
  progressBar: { height: 10, borderRadius: 5 },
  listContent: { padding: 16, paddingBottom: 100 },
  separator: { height: 12 },
  clientCard: { borderRadius: 12, borderLeftWidth: 4, elevation: 2 },
  clientHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  clientInfo: { flex: 1, marginRight: 8 },
  clientNameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  clientMeta: { alignItems: "flex-end" },
  deliveryRow: { flexDirection: "row", alignItems: "center", marginTop: 6, gap: 4 },
  cardDivider: { marginVertical: 10 },
  itemRow: {
    flexDirection: "row", alignItems: "center",
    paddingVertical: 4, minHeight: 52,
  },
  itemInfo: { flex: 1, marginRight: 8 },
  stepper: { flexDirection: "row", alignItems: "center" },
  stepperBtn: { margin: 0, width: 32, height: 32 },
  stepperInput: {
    width: 56, height: 36, textAlign: "center",
    fontSize: 14, paddingHorizontal: 2,
  },
  confirmButton: { marginTop: 12, minHeight: 48 },
  confirmButtonContent: { minHeight: 48 },
});
