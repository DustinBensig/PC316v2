/**
 * EnrollEase - Multi-Database Supabase Cloud Configuration
 * Database 1: CTU MIS Central Records (Student Registry, Curriculum, Fee Matrices)
 * Database 2: EnrollEase System Database (Appointments, Queue Tickets, Accounts)
 */
window.SUPABASE_CONFIG = {
  mis: {
    name: 'Cebu Technological University - Central MIS Database',
    shortName: 'CTU MIS Gateway',
    url: 'https://nrxdhopyaghtcwomddkf.supabase.co',
    key: 'sb_publishable_MgiU-zgvjgc9Y0mq5PGe5g_Dj4IZhIy',
    environment: 'Staging / Cloud Production'
  },
  enrollease: {
    name: 'EnrollEase Queuing & Appointments Cloud Database',
    shortName: 'EnrollEase Cloud DB',
    url: 'https://rkihpmmafukxeddpnlla.supabase.co',
    key: 'sb_publishable_OJg1am3Xg7SF9Fu1jKKMrA_fyAxz-ML',
    environment: 'Production'
  }
};
