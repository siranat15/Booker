import React, { useContext } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Context
import { AuthProvider, AuthContext } from './context/AuthContext';

// Screens
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import HomeScreen from './screens/HomeScreen';
import HistoryScreen from './screens/HistoryScreen';
import ReturnScreen from './screens/ReturnScreen';

// Admin Screens
import AdminUsersScreen from './screens/AdminUsersScreen';
import AdminAddBookScreen from './screens/AdminAddBookScreen';
import AdminBorrowedScreen from './screens/AdminBorrowedScreen';
import AdminBooksScreen from './screens/AdminBooksScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// --- Member Role Navigation ---
function MemberTabs() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;

                    if (route.name === 'Home') {
                        iconName = focused ? 'library' : 'library-outline';
                    } else if (route.name === 'Return') {
                        iconName = focused ? 'arrow-undo' : 'arrow-undo-outline';
                    } else if (route.name === 'History') {
                        iconName = focused ? 'time' : 'time-outline';
                    }

                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: '#007AFF',
                tabBarInactiveTintColor: 'gray',
                headerShown: false,
            })}
        >
            <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Browse' }} />
            <Tab.Screen name="Return" component={ReturnScreen} options={{ title: 'Return' }} />
            <Tab.Screen name="History" component={HistoryScreen} options={{ title: 'History' }} />
        </Tab.Navigator>
    );
}

// --- Admin Role Navigation ---
function AdminTabs() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;

                    if (route.name === 'Books') {
                        iconName = focused ? 'library' : 'library-outline';
                    } else if (route.name === 'Users') {
                        iconName = focused ? 'people' : 'people-outline';
                    } else if (route.name === 'Borrowed') {
                        iconName = focused ? 'book' : 'book-outline';
                    } else if (route.name === 'AddBook') {
                        iconName = focused ? 'add-circle' : 'add-circle-outline';
                    } else if (route.name === 'Logout') {
                        iconName = focused ? 'log-out' : 'log-out-outline';
                    }

                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: '#007AFF',
                tabBarInactiveTintColor: 'gray',
                headerShown: false,
            })}
        >
            <Tab.Screen name="Books" component={AdminBooksScreen} options={{ title: 'Books' }} />
            <Tab.Screen name="Borrowed" component={AdminBorrowedScreen} options={{ title: 'Borrowed' }} />
            <Tab.Screen name="Users" component={AdminUsersScreen} options={{ title: 'Members' }} />
            <Tab.Screen name="AddBook" component={AdminAddBookScreen} options={{ title: 'Add Book' }} />
        </Tab.Navigator>
    );
}

function AuthStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
        </Stack.Navigator>
    );
}

function AppNavigation() {
    const { user, isLoading, logout } = useContext(AuthContext);

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }

    return (
        <NavigationContainer>
            {user ? (
                <Stack.Navigator>
                    {user.role === 'admin' ? (
                        <Stack.Screen
                            name="AdminMain"
                            component={AdminTabs}
                            options={{
                                headerShown: true,
                                title: 'Admin Dashboard',
                                headerRight: () => (
                                    <Ionicons
                                        name="log-out-outline"
                                        size={24}
                                        color="#007AFF"
                                        onPress={logout}
                                        style={{ marginRight: 16 }}
                                    />
                                )
                            }}
                        />
                    ) : (
                        <Stack.Screen
                            name="MemberMain"
                            component={MemberTabs}
                            options={{
                                headerShown: true,
                                title: 'Library',
                                headerRight: () => (
                                    <Ionicons
                                        name="log-out-outline"
                                        size={24}
                                        color="#007AFF"
                                        onPress={logout}
                                        style={{ marginRight: 16 }}
                                    />
                                )
                            }}
                        />
                    )}
                </Stack.Navigator>
            ) : (
                <AuthStack />
            )}
        </NavigationContainer>
    );
}

export default function App() {
    return (
        <AuthProvider>
            <AppNavigation />
        </AuthProvider>
    );
}