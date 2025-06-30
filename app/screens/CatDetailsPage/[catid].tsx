import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet, useWindowDimensions, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import GlobalStyles from '../../../assets/styles/GlobalStyles';
import LoadingIndicator from '../../components/LoadingIndicator';
import Button from '../../components/Button';
import HistoryChart from '../../components/charts/HistoryChart';
import { useCatDetails, useCatHistory } from '../../utils/features/cats/hooks';
import { DataPeriod } from '../../utils/features/cats/types';


// Thank you for reading this code.
// Milestone: 05/18/25
// Code mostly works.
// Last git commit: eab196a

const CatDetailsPage = (): JSX.Element => {
  const { catid } = useLocalSearchParams();
  const router = useRouter();
  const { width } = useWindowDimensions();
  
  // State for responsive layout
  const [contentWidth, setContentWidth] = useState('100%');
  const [columnsCount, setColumnsCount] = useState(2);
  
  // Handle responsive width based on screen size
  useEffect(() => {
    if (width < 600) {
      // Mobile: full width with padding
      setContentWidth('100%');
      setColumnsCount(1);
    } else if (width < 1024) {
      // Tablet: 80% of screen width
      setContentWidth('80%');
      setColumnsCount(2);
    } else if (width < 1440) {
      // Desktop: 70% of screen width
      setContentWidth('70%');
      setColumnsCount(2);
    } else {
      // Large desktop: 60% of screen width
      setContentWidth('60%');
      setColumnsCount(2);
    }
  }, [width]);

  // Safely extract and convert catid
  const rawCatId = catid;
  const processedCatId = Array.isArray(rawCatId) ? rawCatId[0] : rawCatId;

  // Fetch cat details using the custom hook
  const { cat, loading: loadingCat } = useCatDetails(processedCatId);

  // Fetch history data using the updated hook
  const {
    historyData,
    loading: loadingHistoryData,
    error: historyError,
    dataType,
    setDataType,
    period,
    setPeriod,
  } = useCatHistory(processedCatId);

  const goBack = () => {
    router.back();
  };

  const navigateToPetJournal = () => {
    Alert.alert('Coming Soon', 'Pet Journal feature will be available soon!');
  };

  if (loadingCat) {
    return (
      <View style={[GlobalStyles.container, GlobalStyles.contentContainer]}>
        <LoadingIndicator />
      </View>
    );
  }

  // Function to render data fields in a grid
  const renderCatInfoGrid = () => {
    // Define all data fields to display
    const dataFields = [
      { label: 'Name', value: cat?.catname || 'Unknown', important: true },
      { label: 'Breed', value: cat?.catbreed || 'Unknown' },
      { label: 'Age', value: cat?.catage ? `${cat.catage} years` : 'Unknown' },
      { label: 'Weight', value: cat?.catweight ? `${cat.catweight} lbs` : 'Unknown' },
      { label: 'Length', value: cat?.catlength ? `${cat.catlength} in` : 'Unknown' },
      { label: 'Sex', value: cat?.catsex || 'Unknown' },
      { label: 'Feeder ID', value: cat?.feederid?.toString() || 'Not assigned' },
    ];
    
    // For single column on mobile, render stacked
    if (columnsCount === 1) {
      return (
        <View style={styles.catInfoContainer}>
          {dataFields.map((field, index) => (
            <View 
              key={index} 
              style={[
                styles.infoItem, 
                field.important && styles.importantInfoItem
              ]}
            >
              <Text style={[styles.infoLabel, field.important && styles.importantInfoLabel]}>
                {field.label}:
              </Text>
              <Text style={[styles.infoValue, field.important && styles.importantInfoValue]}>
                {field.value}
              </Text>
            </View>
          ))}
        </View>
      );
    }
    
    // For tablets and desktop, render in grid
    return (
      <View style={styles.catInfoGrid}>
        {dataFields.map((field, index) => (
          <View 
            key={index} 
            style={[
              styles.gridItem, 
              field.important && styles.importantGridItem,
              // Make the name span full width
              field.label === 'Name' && styles.fullWidthGridItem
            ]}
          >
            <Text style={[styles.infoLabel, field.important && styles.importantInfoLabel]}>
              {field.label}
            </Text>
            <Text style={[styles.infoValue, field.important && styles.importantInfoValue]}>
              {field.value}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={GlobalStyles.container}>
      <ScrollView 
        style={GlobalStyles.schedulerScrollView}
        contentContainerStyle={styles.scrollViewContent}
      >
        <View style={[
          styles.contentContainer,
          { width: contentWidth as any, maxWidth: 900 }
        ]}>
          {/* Add header with back button */}
          <View style={styles.headerContainer}>
            <View style={styles.header}>
              <TouchableOpacity 
                style={GlobalStyles.backButton} 
                onPress={goBack}
              >
                <Text style={GlobalStyles.backButtonText}>← Back</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={[GlobalStyles.title, styles.pageTitle]}>
            Cat Details
          </Text>

          {/* Cat Details Card with Grid Layout */}
          <View style={[GlobalStyles.catDetailsCard, styles.detailsCard]}>
            {renderCatInfoGrid()}
          </View>

          {/* History Chart Section */}
          <View style={styles.sectionContainer}>
            <Text style={[GlobalStyles.sectionTitle, styles.sectionTitle]}>Cat History</Text>

            <HistoryChart
              data={historyData}
              dataType={dataType}
              period={period}
              onDataTypeChange={setDataType}
              onPeriodChange={setPeriod as (period: DataPeriod) => void}
              loading={loadingHistoryData}
              error={historyError}
            />
          </View>

          {/* Actions Section */}
          <View style={styles.actionsContainer}>
            {/* Pet Journal Button */}
            <Button
              title="View Pet Journal"
              variant="primary"
              onPress={navigateToPetJournal}
              style={styles.actionButton}
            />

            {/* Edit Button - now positioned below the Journal button */}
            <Button
              title="Edit Cat"
              variant="secondary"
              onPress={() =>
                router.push({
                  pathname: '/screens/EditCatPage/[catid]',
                  params: { catid: processedCatId.toString() },
                })
              }
              style={styles.actionButton}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  scrollViewContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingBottom: 40,
    paddingTop: Platform.OS === 'web' ? 20 : 0,
  },
  contentContainer: {
    alignSelf: 'center',
    width: '100%',
  },
  headerContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 0,
  },
  header: {
    width: '100%',
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 20,
    textAlign: 'center',
  },
  detailsCard: {
    marginHorizontal: 0,
    width: '100%',
    padding: 20,
  },
  catInfoContainer: {
    width: '100%',
  },
  catInfoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -10,
  },
  infoItem: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  gridItem: {
    width: '50%',
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  fullWidthGridItem: {
    width: '100%',
    paddingBottom: 12,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  importantGridItem: {
    backgroundColor: '#f9f9f9',
    padding: 10,
    borderRadius: 6,
  },
  importantInfoItem: {
    backgroundColor: '#f9f9f9',
    padding: 10,
    borderRadius: 6,
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
  },
  importantInfoLabel: {
    fontSize: 15,
    color: '#444',
  },
  importantInfoValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  sectionContainer: {
    width: '100%',
    marginTop: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    textAlign: 'left',
    marginBottom: 15,
  },
  actionsContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
  },
  actionButton: {
    width: '100%',
    maxWidth: 300,
    marginBottom: 15,
  },
});

export default CatDetailsPage;