import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { subscribeToArticles, subscribeToSalas } from '../services/firestoreService';
import PrimaryButton from '../components/PrimaryButton';
import { articleIconName } from '../components/articleIcon';
import { COLORS } from '../theme/palette';

const BASE_CATEGORIES = ['Todos', 'Herramientas', 'Dispositivos', 'Cables'];

export default function ArticulosScreen({ navigation }) {
  const [articles, setArticles] = useState([]);
  const [salas, setSalas] = useState([]);
  const [filteredArticles, setFilteredArticles] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [selectedSalaId, setSelectedSalaId] = useState('todas');

  useEffect(() => {
    const unsubArticles = subscribeToArticles((articlesData) => {
      setArticles(articlesData);
      setFilteredArticles(articlesData);
    });

    const unsubSalas = subscribeToSalas((salasList) => {
      setSalas(salasList);
    });

    return () => {
      unsubArticles();
      unsubSalas();
    };
  }, []);

  useEffect(() => {
    let filtered = articles;

    // Filtro por laboratorio físico
    if (selectedSalaId !== 'todas') {
      filtered = filtered.filter((article) => article.salaId === selectedSalaId);
    }

    // Filtro por categoría
    if (selectedCategory !== 'Todos') {
      filtered = filtered.filter((article) => article.categoria === selectedCategory);
    }

    // Filtro por búsqueda
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (article) =>
          article.nombre?.toLowerCase().includes(q) ||
          article.descripcion?.toLowerCase().includes(q) ||
          article.codigoActivo?.toLowerCase().includes(q) ||
          article.salaNombre?.toLowerCase().includes(q)
      );
    }

    setFilteredArticles(filtered);
  }, [searchQuery, selectedCategory, selectedSalaId, articles]);

  const categories = articles.some((a) => a.categoria === 'Redes')
    ? [...BASE_CATEGORIES, 'Redes']
    : BASE_CATEGORIES;

  const sectionTitle =
    selectedCategory === 'Todos' ? 'Inventario Localizado' : selectedCategory;
  const count = filteredArticles.length;

  const renderArticle = (article) => {
    const out = !article.stock;
    const availability = out ? 'Agotado' : `${article.stock} disponibles`;

    return (
      <View key={article.id} style={styles.articleCard}>
        <View style={styles.articleRow}>
          <View style={styles.articleThumb}>
            <MaterialCommunityIcons
              name={articleIconName(article.categoria)}
              size={30}
              color={COLORS.primary}
            />
          </View>
          <View style={styles.articleInfo}>
            <View style={styles.metaTopRow}>
              <Text style={styles.articleCategory}>{article.categoria}</Text>
              {article.codigoActivo ? (
                <Text style={styles.codigoActivoTag}>{article.codigoActivo}</Text>
              ) : null}
            </View>

            <Text style={styles.articleName}>{article.nombre}</Text>

            {/* Ubicación física de Laboratorio */}
            <View style={styles.salaBadge}>
              <MaterialCommunityIcons
                name="door-open"
                size={14}
                color="#256B42"
              />
              <Text style={styles.salaBadgeText} numberOfLines={1}>
                {article.salaNombre || 'Laboratorio Central'}
              </Text>
            </View>

            <View style={styles.availabilityRow}>
              <View
                style={[
                  styles.dot,
                  { backgroundColor: out ? COLORS.error : COLORS.primary },
                ]}
              />
              <Text
                style={[
                  styles.availabilityText,
                  out && { color: COLORS.error },
                ]}
              >
                {availability}
              </Text>
            </View>
          </View>
        </View>

        <PrimaryButton
          label={out ? 'Agotado' : 'Solicitar préstamo'}
          icon="plus"
          size="sm"
          disabled={out}
          onPress={() => navigation.navigate('LoanRequest', { article })}
          style={styles.solicitButton}
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Catálogo de Activos</Text>
        <Text style={styles.subtitle}>
          Inventario físico y disponibilidad en tiempo real por laboratorio.
        </Text>

        {/* Buscador */}
        <View style={styles.searchContainer}>
          <MaterialCommunityIcons name="magnify" size={22} color={COLORS.textSoft} />
          <TextInput
            placeholder="Buscar por equipo, código o laboratorio..."
            placeholderTextColor="#7E8A81"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialCommunityIcons
                name="close-circle"
                size={20}
                color={COLORS.textSoft}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Filtro por Laboratorio Físico */}
        <Text style={styles.filterTitle}>Filtrar por Laboratorio:</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.salaChipsRow}
        >
          <TouchableOpacity
            onPress={() => setSelectedSalaId('todas')}
            style={[
              styles.salaChip,
              selectedSalaId === 'todas' && styles.salaChipActive,
            ]}
          >
            <Text
              style={[
                styles.salaChipText,
                selectedSalaId === 'todas' && styles.salaChipTextActive,
              ]}
            >
              Todos los Labs
            </Text>
          </TouchableOpacity>

          {salas.map((sala) => {
            const isSelected = selectedSalaId === sala.id;
            return (
              <TouchableOpacity
                key={sala.id}
                onPress={() => setSelectedSalaId(sala.id)}
                style={[
                  styles.salaChip,
                  isSelected && styles.salaChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.salaChipText,
                    isSelected && styles.salaChipTextActive,
                  ]}
                >
                  {sala.codigo} ({sala.nombre.split(' ')[1] || 'Lab'})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Filtro por Categorías */}
        <Text style={styles.filterTitle}>Categoría:</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          {categories.map((category) => {
            const active = selectedCategory === category;
            return (
              <TouchableOpacity
                key={category}
                onPress={() => setSelectedCategory(category)}
                style={[styles.chip, active && styles.chipActive]}
                activeOpacity={0.85}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {category}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Header de Resultados */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{sectionTitle}</Text>
          <Text style={styles.sectionMeta}>
            {count} {count === 1 ? 'artículo disponible' : 'artículos disponibles'}
          </Text>
        </View>

        {filteredArticles.length === 0 ? (
          <View style={styles.emptyCard}>
            <MaterialCommunityIcons
              name="package-variant"
              size={44}
              color={COLORS.textSoft}
            />
            <Text style={styles.emptyText}>
              No se encontraron activos en este laboratorio o categoría
            </Text>
          </View>
        ) : (
          filteredArticles.map(renderArticle)
        )}

        <View style={styles.infoBanner}>
          <MaterialCommunityIcons
            name="information-outline"
            size={20}
            color={COLORS.primary}
          />
          <Text style={styles.infoText}>
            Cada solicitud se enruta automáticamente al Gestor del laboratorio
            seleccionado. Revisa tus aprobaciones desde Inicio o en Historial.
          </Text>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    fontSize: 28,
    color: COLORS.text,
    letterSpacing: -0.6,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: 16,
    lineHeight: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderInput,
    borderRadius: 14,
    height: 50,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: COLORS.text,
    padding: 0,
  },
  filterTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3E4941',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  salaChipsRow: {
    gap: 8,
    paddingBottom: 4,
    marginBottom: 14,
  },
  salaChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#EFF5F1',
    borderWidth: 1,
    borderColor: '#BDCAC0',
  },
  salaChipActive: {
    backgroundColor: '#256B42',
    borderColor: '#256B42',
  },
  salaChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#256B42',
  },
  salaChipTextActive: {
    color: '#FFFFFF',
  },
  chipsRow: {
    gap: 8,
    paddingBottom: 4,
    marginBottom: 16,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderInput,
  },
  chipActive: {
    backgroundColor: COLORS.primaryDark,
    borderColor: COLORS.primaryDark,
  },
  chipText: {
    fontFamily: 'Inter_500Medium',
    fontWeight: '500',
    fontSize: 13,
    color: COLORS.text,
  },
  chipTextActive: {
    color: COLORS.onPrimary,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    fontSize: 16,
    color: COLORS.text,
  },
  sectionMeta: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: COLORS.textSoft,
  },
  emptyCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 10,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  articleCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
  },
  articleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  articleThumb: {
    width: 58,
    height: 58,
    borderRadius: 14,
    backgroundColor: COLORS.greenSoftStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  articleInfo: {
    flex: 1,
  },
  metaTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  articleCategory: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: COLORS.textSoft,
  },
  codigoActivoTag: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4F6355',
    backgroundColor: '#EFF5F1',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    fontFamily: 'monospace',
  },
  articleName: {
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    fontSize: 17,
    color: COLORS.text,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  salaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF5F1',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  salaBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#256B42',
  },
  availabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  availabilityText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: COLORS.textMuted,
  },
  solicitButton: {
    width: '100%',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: COLORS.greenSoft,
    borderRadius: 14,
    padding: 14,
    marginTop: 4,
  },
  infoText: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.textMuted,
  },
  bottomSpacing: {
    height: 100,
  },
});
