import { StyleSheet, Dimensions, Platform } from "react-native";

// Helper function to get dynamic width based on screen size
const getResponsiveWidth = () => {
  const { width } = Dimensions.get('window');
  
  if (width < 375) {
    return '95%'; // Small phones
  } else if (width < 768) {
    return '90%'; // Phones
  } else if (width < 1024) {
    return '85%'; // Tablets/iPads
  } else if (width < 1366) {
    return '75%'; // Small laptops/large tablets
  } else {
    return '65%'; // Desktops and large screens (max 1200px)
  }
};

const GlobalStyles = StyleSheet.create({
  // Container styles
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  contentContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 1200 : '100%',
    alignSelf: 'center',
  },
  responsiveContentContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    width: getResponsiveWidth(),
    alignSelf: 'center',
    maxWidth: 1200,
  },
  safeAreaContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  // Mobile browser specific styles
  mobileSafeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  mobileScrollView: {
    flex: 1,
    width: '100%',
  },
  mobileScrollViewContent: {
    flexGrow: 1,
    paddingBottom: 50,
    paddingTop: 60, // Extra padding for mobile browser status bar
  },
  mobileBottomPadding: {
    height: 50,
  },
  
  // Grid layout system
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -10, // Negative margin for the column padding
    width: '100%',
  },
  col2: {
    width: '50%',
    paddingHorizontal: 10,
  },
  col3: {
    width: '33.33%',
    paddingHorizontal: 10,
  },
  col4: {
    width: '25%',
    paddingHorizontal: 10,
  },
  // Responsive columns (adjust based on screen size)
  responsiveCol: {
    width: '100%', // Default for small screens
    paddingHorizontal: 10,
    '@media (min-width: 768px)': {
      width: '50%', // For tablets and up
    },
    '@media (min-width: 1024px)': {
      width: '33.33%', // For laptops and up
    },
  },
  
  // Card styles
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    marginVertical: 12,
    width: '100%',
    // Platform-specific shadow
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
      },
    }),
    borderWidth: 1,
    borderColor: '#eaeaea',
  },
  
  // Text styles
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 18,
    color: "#666666",
    marginBottom: 30,
    textAlign: "center",
  },
  
  // Form styles
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
    width: "100%",
  },
  
  // Button styles
  buttonContainer: {
    width: "100%",
    marginVertical: 10,
    alignItems: "center", // Center buttons on larger screens
  },
  button: {
    backgroundColor: "#f5f5f5",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: "center",
    marginVertical: 8,
    width: "100%",
    maxWidth: 400, // Limit width on larger screens
    minHeight: 50, // Ensure minimum height for consistency
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
  },
  primaryButton: {
    backgroundColor: "#000000",
  },
  primaryButtonText: {
    color: "#ffffff",
  },
  secondaryButton: {
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#000000",
  },
  secondaryButtonText: {
    color: "#000000",
  },
  dangerButton: {
    backgroundColor: "#d9534f",
  },
  dangerButtonText: {
    color: "#ffffff",
  },
  
  // Profile & form styles
  profileImageContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  profileImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  infoContainer: {
    width: '90%',
    marginTop: 20,
    maxWidth: 500, // Limit width on larger screens
  },
  formRow: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  value: {
    fontSize: 18,
    color: '#000',
  },
  
  // Other utility styles
  loader: {
    marginVertical: 20,
  },
  linkText: {
    fontSize: 14,
    color: "#2e78b7",
  },
  backButton: {
    marginBottom: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 5,
    backgroundColor: '#f0f0f0',
    alignSelf: 'flex-start',
  },
  backButtonText: {
    fontSize: 16,
    color: '#333',
  },
  
  // Feeder-related styles
  sectionDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
    marginVertical: 20,
    width: '100%',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 10,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  feederInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  linkButton: {
    marginLeft: 10,
    paddingHorizontal: 15,
    height: 45,
  },
  feederCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    marginVertical: 8,
    width: '100%',
    // Platform-specific shadow
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
      },
    }),
    borderLeftWidth: 4,
    borderLeftColor: '#000',
    maxWidth: 700, // Limit width on larger screens
    alignSelf: 'center',
  },
  feederHeader: {
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  feederTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  feederSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  feederContent: {
    flexDirection: 'row',
    marginBottom: 15,
    flexWrap: 'wrap',
  },
  feederLabel: {
    fontSize: 15,
    fontWeight: '500',
    marginRight: 5,
  },
  feederValue: {
    fontSize: 15,
    color: '#444',
  },
  configureButton: {
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 4,
    alignItems: 'center',
    width: '100%',
    marginTop: 8,
  },
  configureButtonText: {
    color: '#000',
    fontWeight: '500',
  },
  noFeedersContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    width: '100%',
    maxWidth: 600,
  },
  noFeedersText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 10,
  },
  noFeedersSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  feederList: {
    width: '100%',
    marginTop: 10,
    marginBottom: 20,
  },
  feederItem: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    width: '100%',
    borderLeftWidth: 4,
    borderLeftColor: '#000',
  },
  feederDetail: {
    fontSize: 14,
    color: '#444',
    marginBottom: 3,
  },
  feedersScrollContainer: {
    maxHeight: 300,
    width: '100%',
    marginBottom: 15,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eaeaea',
    borderRadius: 8,
    padding: 5,
  },
  
  // Scheduler-specific styles
  schedulerScrollView: {
    flex: 1,
    padding: 16,
  },
  schedulerHeaderContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  feedNowContainer: {
    marginBottom: 30,
    alignItems: 'center',
  },
  feedNowButton: {
    width: '80%',
  },
  feedingTimesContainer: {
    marginBottom: 25,
  },
  feedingTimesButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  feedingTimeButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  feedingTimeButtonSelected: {
    borderColor: '#000',
    backgroundColor: '#000',
  },
  feedingTimeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#555',
  },
  feedingTimeTextSelected: {
    color: '#fff',
  },
  scheduleContainer: {
    marginBottom: 30,
  },
  daysHeaderRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  timeHeaderCell: {
    width: 50,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
    padding: 4,
  },
  dayHeaderCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
    padding: 4,
    marginLeft: 1,
    minWidth: 30,
  },
  headerText: {
    fontWeight: 'bold',
    fontSize: 12,
  },
  timeSlotsContainer: {
    maxHeight: 400,
  },
  timeSlotRow: {
    flexDirection: 'row',
    marginBottom: 1,
    height: 40,
  },
  timeCell: {
    width: 50,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
  },
  timeText: {
    fontSize: 10,
  },
  scheduleCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9f9f9',
    marginLeft: 1,
  },
  selectedCell: {
    backgroundColor: '#e0f7e0',
  },
  checkmark: {
    color: 'green',
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveButtonContainer: {
    marginVertical: 20,
    alignItems: 'center',
  },
  navbar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderColor: "#eaeaea",
    paddingTop: 50, // Add extra padding for mobile status bar
  },
  navbarLogo: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000000",
  },
  navLinks: {
    flexDirection: "row",
    alignItems: "center",
  },
  navLinkContainer: {
    marginLeft: 10,
  },
  // Note: You already have navButton and navButtonText styles in GlobalStyles
  navSignUpButton: {
    backgroundColor: "#000000",
  },
  navSignUpText: {
    color: "#ffffff",
  },
  //Cat Detail/Journal
  catDetailsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    // Platform-specific shadow
    elevation: 2, // Android shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#000',
  },
  catDetailsRow: {
    marginBottom: 12,
  },
  catDetailsLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  catDetailsValue: {
    fontSize: 16,
  },
  chartContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginVertical: 15,
    alignItems: 'center',
    // Platform-specific shadow
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  chartTitle: {
    fontWeight: 'bold',
    marginBottom: 10,
  },
  chartDescription: {
    color: '#666',
    marginTop: 10,
    textAlign: 'center',
  },
  chartBars: {
    flexDirection: 'row',
    width: '100%',
    marginTop: 20,
    height: 50,
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  chartBar: {
    width: 20,
    backgroundColor: '#000',
    marginHorizontal: 5,
  },
  chartLabels: {
    flexDirection: 'row',
    width: '100%',
    marginTop: 10,
    justifyContent: 'space-between',
  },
  chartLabel: {
    fontSize: 10,
  },
  petJournalButton: {
    width: '80%',
    alignSelf: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  //Cat Details Chart Styling
    chart: {
      marginVertical: 10,
      borderRadius: 8,
    },
    selectedPointInfo: {
      alignItems: 'center',
      marginVertical: 10,
      paddingVertical: 8,
      paddingHorizontal: 12,
      backgroundColor: '#f5f5f5',
      borderRadius: 8,
    },
    selectedPointDate: {
      fontSize: 14,
      fontWeight: 'bold',
    },
    selectedPointWeight: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#3498db',
    },
  
  // Picker styles for the feeder selection dropdown
  pickerContainer: {
    width: '100%',
    marginBottom: 15,
  },
  pickerLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  picker: {
    width: '100%',
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    marginBottom: 10,
  },
  
  // Input styles for the hardware ID field
  inputContainer: {
    width: '100%',
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  inputHelp: {
    fontSize: 12,
    color: '#888',
    marginTop: 5,
  },
});

export default GlobalStyles;