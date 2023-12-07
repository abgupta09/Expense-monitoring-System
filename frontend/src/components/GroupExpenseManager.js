import React, { useState, useEffect } from 'react';
import Header from './Header';
import AddIcon from '@mui/icons-material/AddCircleOutline';
import SendIcon from '@mui/icons-material/Send';
import "../styles/GroupExpenseManager.css"
import GroupListPanel from './GroupListPanel';
import GroupExpenseForm from './GroupExpenseForm';
import GroupExpenseList from './GroupExpenseList';


function GroupManagement() {
    const [groupName, setGroupName] = useState('');
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [groups, setGroups] = useState([]);
    const [inviteAddress, setInviteAddress] = useState('');
    const [apiKey, setApiKey] = useState('');
    const [editingExpense, setEditingExpense] = useState(null);
    const [groupExpenses, setGroupExpenses] = useState([]);

    const showAlert = (message) => {
        alert(message);
    };

    const handleGroupNameChange = (event) => {
        setGroupName(event.target.value);
    };

    const handleInviteAddressChange = (event) => {
        setInviteAddress(event.target.value);
    };

    const sendInvite = async () => {
        // Logic to send an invite
        // Example: send inviteAddress and group information to backend API
    };

    const handleSendInvite = () => {
        if (!inviteAddress) {
            showAlert("Please enter an invite address.");
            return;
        }
        sendInvite(inviteAddress);
        setInviteAddress(''); 
    };


    const addGroup = async (groupName) => {
        const token = localStorage.getItem('token');
        if (!token) {
            showAlert("User not authenticated");
            return;
        }

        try {
            const response = await fetch('http://127.0.0.1:5000/api/groups/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token
                },
                body: JSON.stringify({ group_name: groupName })
            });

            const data = await response.json();
            if (response.ok) {
                showAlert("Group created successfully");
                fetchUserGroups();
            } else {
                showAlert(data.message);
            }
        } catch (error) {
            showAlert(`Error creating group: ${error.message}`);
        }
    };


    const handleGroupSelect = (groupId) => {
        setSelectedGroup(groupId);
        fetchGroupExpenses(groupId)
    };

    const handleAddGroupClick = () => {
        if (!groupName) {
            showAlert("Please enter a group name.");
            return;
        }
        addGroup(groupName);
        setGroupName(''); // Reset the input field after adding the group
    };

    const joinGroup = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            showAlert("User not authenticated");
            return;
        }
    
        try {
            const response = await fetch('http://127.0.0.1:5000/api/groups/join', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token
                },
                body: JSON.stringify({ api_key: apiKey })
            });
    
            const data = await response.json();
            if (response.ok) {
                showAlert("Joined group successfully");
                setApiKey(''); // Reset the API key field after successful join
            } else {
                showAlert(data.message);
            }
        } catch (error) {
            showAlert(`Error joining group: ${error.message}`);
        }
    };

    const handleCancelEdit = () => {
        setEditingExpense(null);
    };

    useEffect(() => {
        fetchUserGroups();
    }, []);

    const fetchUserGroups = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            showAlert("User not authenticated");
            return;
        }

        try {
            const response = await fetch('http://127.0.0.1:5000/api/groups', {
                method: 'GET',
                headers: {
                    'Authorization': token
                }
            });

            const data = await response.json();
            if (response.ok) {
                setGroups(data.data); // Assuming data.data contains the array of groups
            } else {
                showAlert(data.message);
            }
        } catch (error) {
            showAlert(`Error fetching groups: ${error.message}`);
        }

    };

    const [groupMembers, setGroupMembers] = useState([]);

    const fetchGroupMembers = async (groupId) => {
        const token = localStorage.getItem('token');
        if (!token) {
            showAlert("User not authenticated");
            return;
        }

        try {
            const response = await fetch(`http://127.0.0.1:5000/api/groups/${groupId}/members`, {
            method: 'GET',
            headers: {
                'Authorization': token
            }
            });

            const data = await response.json();
            if (response.ok) {
            setGroupMembers(data.members); // Assuming data.members is an array of member objects
            } else {
            showAlert(data.message);
            }
        } catch (error) {
            showAlert(`Error fetching group members: ${error.message}`);
        }
    };

    useEffect(() => {
    if (selectedGroup) {
        fetchGroupMembers(selectedGroup);
    }
    }, [selectedGroup]);

    const addGroupExpense = async (expense) => {
        // Ensure there is a selected group
        if (!selectedGroup) {
            showAlert("No group selected.");
            return;
        }
    
        const token = localStorage.getItem('token');
        if (!token) {
            showAlert("User not authenticated");
            return;
        }
    
        try {
            const response = await fetch(`http://127.0.0.1:5000/api/groups/${selectedGroup}/add_expense`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token
                },
                body: JSON.stringify(expense)
            });
    
            const data = await response.json();
            if (response.ok) {
                showAlert("Expense added successfully");
                fetchGroupExpenses(selectedGroup);
                // You might want to update the state or UI here
            } else {
                showAlert(data.message);
            }
        } catch (error) {
            showAlert(`Error adding expense: ${error.message}`);
        }
    };
    

    // Placeholder function for editing a group expense
    const editGroupExpense = async (expenseId, updatedExpense) => {
        const token = localStorage.getItem('token');
        if (!token) {
            showAlert("User not authenticated");
            return;
        }
    
        try {
            const response = await fetch(`http://127.0.0.1:5000/api/groups/${selectedGroup}/edit_expense/${expenseId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updatedExpense)
            });
    
            const data = await response.json();
            if (response.ok) {
                showAlert("Expense edited successfully");
                setEditingExpense(null);
                fetchGroupExpenses(selectedGroup); 
            } else {
                showAlert(data.message);
            }
        } catch (error) {
            showAlert(`Error editing expense: ${error.message}`);
        }
    };

    const handleStartEditGroupExpense = (expenseId) => {
        const expenseToEdit = groupExpenses.find(expense => expense.group_expense_id === expenseId);
        if (expenseToEdit) {
            setEditingExpense(expenseToEdit);
        } else {
            showAlert("Expense not found");
        }
    };
    

    const handleDeleteGroupExpense = async (expenseId) => {
        const token = localStorage.getItem('token');
        if (!token) {
            showAlert("User not authenticated");
            return;
        }
    
        try {
            const response = await fetch(`http://127.0.0.1:5000/api/groups/${selectedGroup}/expenses/${expenseId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
    
            const data = await response.json();
            if (response.ok) {
                showAlert("Expense deleted successfully");
                setGroupExpenses(groupExpenses.filter(expense => expense.group_expense_id !== expenseId));
            } else {
                showAlert(data.message);
            }
        } catch (error) {
            showAlert(`Error deleting expense: ${error.message}`);
        }
    };

    const fetchGroupExpenses = async (groupId) => {
        const token = localStorage.getItem('token');
        if (!token) {
            showAlert("User not authenticated");
            return;
        }
    
        try {
            const response = await fetch(`http://127.0.0.1:5000/api/groups/${groupId}/expenses`, {
                method: 'GET',
                headers: {
                    'Authorization': token
                }
            });
    
            const data = await response.json();
            if (response.ok) {
                setGroupExpenses(data.expenses); // Set the fetched expenses
            } else {
                showAlert(data.message);
            }
        } catch (error) {
            showAlert(`Error fetching group expenses: ${error.message}`);
        }
    };

    return (
        <div className="app-container">
            <Header/>
            <div className="group-util-container">
                <div className="group-util-section group-form-section">
                    <div className="group-add-form">
                        <input 
                            type="text" 
                            placeholder="Group Name" 
                            value={groupName} 
                            onChange={handleGroupNameChange}
                        />
                        <button className='create-group-btn' onClick={handleAddGroupClick}>
                            <AddIcon />  
                        </button>
                    </div>
                </div>
                <div className="group-util-section join-group-section">
                    <div className="join-group-form">
                        <input 
                            type="text" 
                            placeholder="Enter API key" 
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                        />
                        <button className='joinGroup-Btn' onClick={joinGroup}>
                            Join Group
                        </button>
                    </div>
                </div>
            </div>
            <div className='groupView'>
                <div className='groupList'>
                        <GroupListPanel 
                            groups={groups} 
                            selectedGroup={selectedGroup}
                            onGroupSelect={handleGroupSelect} 
                        /> 
                </div>
                <div className='group-expense-form'>
                    <GroupExpenseForm
                        selectedGroup={selectedGroup}
                        groupMembers={groupMembers} 
                        addGroupExpense={addGroupExpense}
                        editingExpense={editingExpense}
                        editGroupExpense={editGroupExpense}
                        cancelEdit={handleCancelEdit}
                        />
                </div>
            </div>
            <GroupExpenseList
                groupExpenses={groupExpenses}
                startEditGroupExpense={handleStartEditGroupExpense}
                deleteGroupExpense={handleDeleteGroupExpense}
                editGroupExpense={editGroupExpense}
            />
        </div>
    );
}

export default GroupManagement;