import React, { useState, useEffect } from 'react';
import { View, Text, Dimensions, StyleSheet, Pressable, Platform, TouchableOpacity } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { LineChart } from 'react-native-chart-kit';
import GlobalStyles from '../../../assets/styles/GlobalStyles';
import { formatDate } from '../../utils/helpers/dateFormatters';
import { WeightRecord, FeedRecord, DataPeriod, DataType } from '../../utils/features/cats/types';

interface HistoryChartProps {
  data: WeightRecord[] | FeedRecord[];
  dataType: DataType;
  period: DataPeriod;
  onPeriodChange: (period: DataPeriod) => void;
  onDataTypeChange: (type: DataType) => void;
  loading: boolean;
  error?: Error | null;
}

const HistoryChart = ({
  data,
  dataType,
  period,
  onPeriodChange,
  onDataTypeChange,
  loading,
  error
}: HistoryChartProps): JSX.Element => {
  const [selectedDataPoint, setSelectedDataPoint] = useState<{
    value: number;
    index: number;
    date: string;
  } | null>(null);
  
  // Clear selected data point when data type changes
  useEffect(() => {
    setSelectedDataPoint(null);
  }, [dataType, period]);

  // Dropdown options
  const periodOptions: { label: string; value: DataPeriod }[] = [
    { label: 'Past Week', value: 'week' },
    { label: '2-Month (Weekly Averages)', value: 'month' }
  ];
  
  const typeOptions: { label: string; value: DataType }[] = [
    { label: 'Weight History', value: 'weight' },
    { label: 'Feed Amount History', value: 'feed' }
  ];
  
  // Units for display
  const units = dataType === 'weight' ? 'lbs' : 'g';
  const chartTitle = dataType === 'weight' ? 'Weight History' : 'Feed Amount History';

  // Enhanced selection handlers with console logging
  const handlePeriodChange = (newPeriod: DataPeriod) => {
    console.log(`Period changing from ${period} to ${newPeriod}`);
    onPeriodChange(newPeriod);
  };

  const handleDataTypeChange = (newType: DataType) => {
    console.log(`Data type changing from ${dataType} to ${newType}`);
    onDataTypeChange(newType);
  };

  // Handle loading state
  if (loading) {
    return (
      <View style={GlobalStyles.chartContainer}>
        <Text style={GlobalStyles.chartTitle}>{chartTitle}</Text>
        <EnhancedDropdowns
          period={period}
          periodOptions={periodOptions}
          onPeriodChange={handlePeriodChange}
          dataType={dataType}
          typeOptions={typeOptions}
          onDataTypeChange={handleDataTypeChange}
          disabled
        />
        <Text style={GlobalStyles.chartDescription}>Loading data...</Text>
      </View>
    );
  }

  // Handle error state
  if (error) {
    return (
      <View style={GlobalStyles.chartContainer}>
        <Text style={GlobalStyles.chartTitle}>{chartTitle}</Text>
        <EnhancedDropdowns
          period={period}
          periodOptions={periodOptions}
          onPeriodChange={handlePeriodChange}
          dataType={dataType}
          typeOptions={typeOptions}
          onDataTypeChange={handleDataTypeChange}
        />
        <Text style={[GlobalStyles.chartDescription, { color: 'red' }]}>
          {error.message || 'Failed to load data.'}
        </Text>
      </View>
    );
  }

  // Handle empty data
  if (!data || data.length === 0) {
    return (
      <View style={GlobalStyles.chartContainer}>
        <Text style={GlobalStyles.chartTitle}>{chartTitle}</Text>
        <EnhancedDropdowns
          period={period}
          periodOptions={periodOptions}
          onPeriodChange={handlePeriodChange}
          dataType={dataType}
          typeOptions={typeOptions}
          onDataTypeChange={handleDataTypeChange}
        />
        <Text style={GlobalStyles.chartDescription}>
          No {dataType} data available for the selected period
        </Text>
      </View>
    );
  }

  // Extract chart data for react-native-chart-kit
  const chartData = {
    labels: data.map(record => formatDate(record.date)),
    datasets: [
      {
        data: data.map(record => record.value),
        color: () => 'rgba(0, 0, 0, 0.8)', 
        strokeWidth: 2
      }
    ],
    legend: [dataType === 'weight' ? 'Weight (lbs)' : 'Feed Amount (g)']
  };

  // Screen width calculation
  const screenWidth = Dimensions.get('window').width - 40; // 40px for padding
  
  // Chart configuration
  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 1,
    color: () => `rgba(0, 0, 0, 0.6)`,
    labelColor: () => '#666666',
    style: {
      borderRadius: 16
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: '#fafafa'
    }
  };

  // Custom decorator for handling touch events
  const handleDataPointClick = ({ value, index }: { value: number, index: number }) => {
    if (index >= 0 && index < data.length) {
      setSelectedDataPoint({
        value,
        index,
        date: data[index].date
      });
    }
  };

  return (
    <View style={GlobalStyles.chartContainer}>
      <Text style={GlobalStyles.chartTitle}>{chartTitle}</Text>
      <EnhancedDropdowns
        period={period}
        periodOptions={periodOptions}
        onPeriodChange={handlePeriodChange}
        dataType={dataType}
        typeOptions={typeOptions}
        onDataTypeChange={handleDataTypeChange}
      />
      
      {selectedDataPoint ? (
        <View style={GlobalStyles.selectedPointInfo}>
          <Text style={GlobalStyles.selectedPointDate}>
            {formatDate(data[selectedDataPoint.index].date)}
          </Text>
          <Text style={GlobalStyles.selectedPointWeight}>
            {selectedDataPoint.value.toFixed(1)} {units}
          </Text>
        </View>
      ) : (
        <Text style={GlobalStyles.chartDescription}>
          Tap on a point to see details
        </Text>
      )}
      
      <View style={styles.chartWrapper}>
        <LineChart
          data={chartData}
          width={screenWidth}
          height={220}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
          withVerticalLabels={true}
          withHorizontalLabels={true}
          fromZero={false}
          onDataPointClick={handleDataPointClick}
          verticalLabelRotation={0}
          segments={5}
          yAxisInterval={1}
        />
      </View>
    </View>
  );
};

// Enhanced dropdown component with platform-specific rendering
const EnhancedDropdowns = ({
  period,
  periodOptions,
  onPeriodChange,
  dataType,
  typeOptions,
  onDataTypeChange,
  disabled = false
}: {
  period: DataPeriod;
  periodOptions: { label: string; value: DataPeriod }[];
  onPeriodChange: (period: DataPeriod) => void;
  dataType: DataType;
  typeOptions: { label: string; value: DataType }[];
  onDataTypeChange: (type: DataType) => void;
  disabled?: boolean;
}) => {
  // Use specialized pickers on iOS/Android and buttons on web
  const isWeb = Platform.OS === 'web';
  
  if (isWeb) {
    return (
      <View style={styles.dropdownContainer}>
        <View style={styles.webButtonsContainer}>
          <Text style={styles.selectorLabel}>Time Period:</Text>
          <View style={styles.buttonGroup}>
            {periodOptions.map(option => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.selectorButton,
                  period === option.value && styles.selectorButtonSelected
                ]}
                onPress={() => !disabled && onPeriodChange(option.value)}
                disabled={disabled}
              >
                <Text style={[
                  styles.selectorButtonText,
                  period === option.value && styles.selectorButtonTextSelected
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.webButtonsContainer}>
          <Text style={styles.selectorLabel}>Data Type:</Text>
          <View style={styles.buttonGroup}>
            {typeOptions.map(option => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.selectorButton,
                  dataType === option.value && styles.selectorButtonSelected
                ]}
                onPress={() => !disabled && onDataTypeChange(option.value)}
                disabled={disabled}
              >
                <Text style={[
                  styles.selectorButtonText,
                  dataType === option.value && styles.selectorButtonTextSelected
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    );
  }
  
  // Native mobile implementation - use buttons instead of Picker for better cross-platform compatibility
  return (
    <View style={styles.dropdownContainer}>
      <View style={styles.mobileContainer}>
        <Text style={styles.mobileLabel}>Time Period:</Text>
        <View style={styles.mobileButtons}>
          {periodOptions.map(option => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.mobileButton,
                period === option.value && styles.mobileButtonSelected
              ]}
              onPress={() => !disabled && onPeriodChange(option.value)}
              disabled={disabled}
            >
              <Text style={[
                styles.mobileButtonText,
                period === option.value && styles.mobileButtonTextSelected
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      <View style={styles.mobileContainer}>
        <Text style={styles.mobileLabel}>Data Type:</Text>
        <View style={styles.mobileButtons}>
          {typeOptions.map(option => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.mobileButton,
                dataType === option.value && styles.mobileButtonSelected
              ]}
              onPress={() => !disabled && onDataTypeChange(option.value)}
              disabled={disabled}
            >
              <Text style={[
                styles.mobileButtonText,
                dataType === option.value && styles.mobileButtonTextSelected
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  dropdownContainer: {
    flexDirection: 'column',
    marginBottom: 15,
    width: '100%',
  },
  pickerContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 5,
    marginBottom: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  picker: {
    width: '100%',
    height: 40,
  },
  chartWrapper: {
    marginVertical: 8,
    borderRadius: 16,
    overflow: 'hidden',
  },
  chart: {
    borderRadius: 16,
  },
  // Web-specific styles
  webButtonsContainer: {
    marginBottom: 12,
  },
  selectorLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  selectorButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 10,
    margin: 2,
    borderRadius: 5,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectorButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  selectorButtonText: {
    fontSize: 12,
    color: '#333',
  },
  selectorButtonTextSelected: {
    color: 'white',
    fontWeight: 'bold',
  },
  // Mobile-specific styles (new)
  mobileContainer: {
    marginBottom: 12,
  },
  mobileLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#333',
  },
  mobileButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  mobileButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 12,
    margin: 3,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  mobileButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#0056b3',
  },
  mobileButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#333',
  },
  mobileButtonTextSelected: {
    color: 'white',
    fontWeight: 'bold',
  }
});

export default HistoryChart;