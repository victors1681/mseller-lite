import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Icon, Text, useTheme } from "react-native-paper";
import { ConsolidadoProducto } from "../../types/preparacion";

interface ProductCardProps {
  producto: ConsolidadoProducto;
  onPress: (producto: ConsolidadoProducto) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ producto, onPress }) => {
  const theme = useTheme();
  const clienteNames = (producto.distribucion ?? []).map(
    (d) => d.nombreCliente || d.codigoCliente
  );

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          borderLeftColor: theme.colors.primary,
        },
      ]}
      onPress={() => onPress(producto)}
      activeOpacity={0.7}
    >
      <View style={styles.topRow}>
        <View style={styles.productInfo}>
          <Text
            variant="titleMedium"
            style={{ fontWeight: "bold", color: theme.colors.onSurface }}
            numberOfLines={2}
          >
            {producto.nombreProducto}
          </Text>
          <Text
            variant="bodySmall"
            style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}
          >
            {producto.codigoProducto} · {producto.unidad ?? ""}
          </Text>
        </View>
      </View>

      <View style={styles.quantityRow}>
        <Text style={styles.quantityLabel}>Total:</Text>
        <Text
          style={[
            styles.quantityValue,
            { color: theme.colors.onSurface },
          ]}
        >
          {producto.cantidadTotal}
        </Text>
        <Text
          style={[styles.unitText, { color: theme.colors.onSurfaceVariant }]}
        >
          {producto.unidad ?? ""}
        </Text>
      </View>

      <Text
        variant="bodySmall"
        style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}
      >
        Clientes: {clienteNames.join(", ") || "—"}
      </Text>
      <View style={styles.actionRow}>
        <Text
          variant="labelLarge"
          style={{ color: theme.colors.primary, fontWeight: "bold" }}
        >
          Confirmar ►
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    minHeight: 48,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  productInfo: {
    flex: 1,
    marginRight: 8,
  },
  confirmedBadge: {
    marginLeft: 8,
  },
  quantityRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 8,
  },
  quantityLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginRight: 8,
  },
  quantityValue: {
    fontSize: 32,
    fontWeight: "900",
    lineHeight: 38,
  },
  unitText: {
    fontSize: 16,
    marginLeft: 6,
  },
  actionRow: {
    marginTop: 8,
    alignItems: "flex-end",
    minHeight: 48,
    justifyContent: "center",
  },
});

export default ProductCard;
