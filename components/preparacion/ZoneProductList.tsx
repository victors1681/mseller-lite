import React, { useState } from "react";
import {
  RefreshControlProps,
  SectionList,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Icon, Text, useTheme } from "react-native-paper";
import {
  ConsolidadoProducto,
  ConsolidadoZona,
} from "../../types/preparacion";
import ProductCard from "./ProductCard";

interface ZoneProductListProps {
  zonas: ConsolidadoZona[];
  onProductPress: (producto: ConsolidadoProducto) => void;
  refreshControl?: React.ReactElement<RefreshControlProps>;
  ListHeaderComponent?: React.ReactElement;
}

interface SectionData {
  title: string;
  data: ConsolidadoProducto[];
  completedCount: number;
  totalCount: number;
}

const ZoneProductList: React.FC<ZoneProductListProps> = ({
  zonas,
  onProductPress,
  refreshControl,
  ListHeaderComponent,
}) => {
  const theme = useTheme();
  const [collapsedZones, setCollapsedZones] = useState<Set<string>>(new Set());

  const sections: SectionData[] = zonas.map((zona) => ({
    title: zona.zona,
    data: collapsedZones.has(zona.zona) ? [] : zona.productos,
    completedCount: zona.productos.filter(
      (p) => p.cantidadPreparada >= p.cantidadTotal
    ).length,
    totalCount: zona.productos.length,
  }));

  const toggleZone = (zona: string) => {
    setCollapsedZones((prev) => {
      const next = new Set(prev);
      if (next.has(zona)) {
        next.delete(zona);
      } else {
        next.add(zona);
      }
      return next;
    });
  };

  const renderSectionHeader = ({ section }: { section: SectionData }) => {
    const isCollapsed = collapsedZones.has(section.title);
    const isComplete = section.completedCount === section.totalCount;

    return (
      <TouchableOpacity
        onPress={() => toggleZone(section.title)}
        activeOpacity={0.7}
        style={[
          styles.sectionHeader,
          { backgroundColor: theme.colors.surfaceVariant },
        ]}
      >
        <View style={styles.sectionLeft}>
          <Icon
            source={isCollapsed ? "chevron-right" : "chevron-down"}
            size={20}
            color={theme.colors.onSurfaceVariant}
          />
          <Text
            variant="titleMedium"
            style={{
              fontWeight: "bold",
              color: theme.colors.onSurface,
              marginLeft: 8,
            }}
          >
            Zona {section.title}
          </Text>
        </View>
        <View style={styles.sectionRight}>
          <Text
            variant="bodyMedium"
            style={{
              color: isComplete ? "#388E3C" : theme.colors.onSurfaceVariant,
              fontWeight: "bold",
            }}
          >
            {section.completedCount}/{section.totalCount}
          </Text>
          {isComplete && (
            <Icon source="check-circle" size={18} color="#388E3C" />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderItem = ({ item }: { item: ConsolidadoProducto }) => (
    <ProductCard producto={item} onPress={onProductPress} />
  );

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => item.codigoProducto}
      renderItem={renderItem}
      renderSectionHeader={renderSectionHeader}
      stickySectionHeadersEnabled
      refreshControl={refreshControl}
      ListHeaderComponent={ListHeaderComponent}
      contentContainerStyle={styles.listContent}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text
            variant="bodyLarge"
            style={{ color: theme.colors.onSurfaceVariant }}
          >
            No hay productos en esta zona
          </Text>
        </View>
      }
    />
  );
};

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: 140,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 48,
  },
  sectionLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  sectionRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  empty: {
    padding: 32,
    alignItems: "center",
  },
});

export default ZoneProductList;
