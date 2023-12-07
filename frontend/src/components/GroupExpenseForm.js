import React, { useState, useEffect } from 'react';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/AddCircleOutline';
import CancelIcon from '@mui/icons-material/Cancel';
import '../styles/ExpenseForm.css';
import '../styles/GroupExpenseForm.css';

function GroupExpenseForm({ selectedGroup, groupMembers, addGroupExpense, editingExpense, editGroupExpense, cancelEdit}) {
    const [amount, setAmount] = useState(editingExpense ? editingExpense.amount : '');
    const [description, setDescription] = useState(editingExpense ? editingExpense.description : ''); // Added description state
    const [date, setDate] = useState(editingExpense ? editingExpense.date : '');
    const [splitMethod, setSplitMethod] = useState(editingExpense ? editingExpense.splitMethod : 'equal');
    const [paidFor, setPaidFor] = useState({});
    const [splitDetails, setSplitDetails] = useState({ payer: '', amount: 0, shares: {} });
    const [payer, setPayer] = useState('');

    useEffect(() => {
        if (editingExpense && groupMembers.length > 0) {
            // Set basic fields
            setAmount(editingExpense.amount.toString());
            setDescription(editingExpense.description);
            setDate(new Date(editingExpense.date).toISOString().split('T')[0]);
            setSplitMethod(editingExpense.splitMethod);
    
            // Map the username to user_id for paid_by
            const payerId = groupMembers.find(member => member.username === editingExpense.paid_by)?.user_id || '';
            setPayer(payerId);
    
            // Map usernames to user_ids for paid_for
            const paidForState = groupMembers.reduce((acc, member) => {
                acc[member.user_id] = editingExpense.paid_for.includes(member.username);
                return acc;
            }, {});
            setPaidFor(paidForState);
    
            // Set splitDetails using the payerId and ensuring shares use user_ids
            const updatedSplitDetails = {
                payer: payerId,
                amount: editingExpense.split_details.amount,
                shares: {}
            };
    
            // Map usernames in shares to user_ids
            Object.entries(editingExpense.split_details.shares).forEach(([username, share]) => {
                const userId = groupMembers.find(member => member.username === username)?.user_id || '';
                updatedSplitDetails.shares[userId] = share;
            });
    
            setSplitDetails(updatedSplitDetails);

        }
    }, [groupMembers, editingExpense]);
    

    const handlePaidForChange = (memberId) => {
        setPaidFor((prevPaidFor) => ({
            ...prevPaidFor,
            [memberId]: !prevPaidFor[memberId]
        }));
    };

    const handlePayerChange = (payerId) => {
        setSplitDetails(prevDetails => ({ ...prevDetails, payer: payerId }));
    };
    
    const handleAmountChange = (amount) => {
        setSplitDetails(prevDetails => ({ ...prevDetails, amount: parseFloat(amount) }));
    };
    
    const handleShareChange = (memberId, share) => {
        setSplitDetails(prevDetails => ({
            ...prevDetails,
            shares: { ...prevDetails.shares, [memberId]: parseFloat(share) }
        }));
    };

    const calculateEqualSplit = () => {
        const equalShare = 100 / groupMembers.length;
        const shares = groupMembers.reduce((acc, member) => {
            acc[member.user_id] = equalShare;
            return acc;
        }, {});
        return {
            payer: splitDetails.payer,
            amount: amount,
            shares: shares,
        };
    };

    const calculatePercentageSplit = () => {
        const totalPercentage = Object.values(splitDetails.shares).reduce((acc, share) => acc + share, 0);
    
        if (totalPercentage !== 100) {
            throw new Error("The sum of percentage shares must equal 100.");
        }
    
        return {
            payer: splitDetails.payer,
            amount: splitDetails.amount,
            shares: splitDetails.shares,
        };
    };
    

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!payer) {
            alert("Please select who paid for the expense.");
            return;
        }
        const paidForMemberIds = Object.entries(paidFor)
        .filter(([memberId, isPaid]) => isPaid)
        .map(([memberId]) => memberId);

        let expenseSplitDetails;
        try {
            switch (splitMethod) {
                case 'percentage':
                    expenseSplitDetails = calculatePercentageSplit();
                    break;
                case 'custom':
                    // Assuming custom split logic is already handled
                    expenseSplitDetails = splitDetails;
                    break;
                default:
                    // Assuming equal split logic is already handled
                    expenseSplitDetails = calculateEqualSplit();
                    break;
            }
        } catch (error) {
            alert(error.message); // Alert the user of the error
            return; // Return early from the function
        }
        const currentExpense = {
            groupId: selectedGroup,
            amount: parseFloat(amount),
            description,
            paid_by: payer,
            date: date ? new Date(date).toISOString() : new Date().toISOString(),
            splitMethod,
            splitDetails: {
                ...expenseSplitDetails,
                payer: payer,
            },
            paidFor: paidForMemberIds,
        };
        
        if (editingExpense) {
            editGroupExpense(editingExpense.group_expense_id, currentExpense); // Call edit function if editing
        } else {
            addGroupExpense(currentExpense); // Call add function if not editing
        }

        // clearing the form
        clearForm();
    };

    const clearForm = () => {
        // Clearing the form fields and resetting state
        setAmount('');
        setDescription('');
        setDate('');
        setSplitMethod('equal');
        setPaidFor({});
        setPayer('');
        cancelEdit(); // Call the function passed from the parent to cancel editing
    };
    
    const handleCancelEdit = () => {
        // Reset the form and clear the editing state
        clearForm();
    };

    return (
        <form className='expense-form-fields' onSubmit={handleSubmit}>
            <div className="form-content">
                <input 
                    type="number" 
                    value={amount} 
                    onChange={(e) => setAmount(e.target.value)} 
                    placeholder="Amount"
                    required
                />
                <input 
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Description"
                    required
                />
                <input 
                    type="date" 
                    value={date} 
                    onChange={(e) => setDate(e.target.value)} 
                />
                <label htmlFor="splitMethodSelect">Split Method</label>
                <select 
                    value={splitMethod} 
                    onChange={(e) => setSplitMethod(e.target.value)}
                    id="splitMethodSelect"  // Adding an ID for the association with the label
                >
                    <option value="equal">Equal</option>
                    <option value="percentage">Percentage</option>
                    <option value="custom">Custom</option>
                </select>
                <fieldset className="payer-fieldset">
                    <legend>Paid By</legend>
                    <select 
                        className="custom-select" 
                        value={payer} 
                        onChange={(e) => setPayer(e.target.value)}
                    >
                        <option value="">Select</option>
                        {groupMembers.map(member => (
                            <option key={member.user_id} value={member.user_id}>
                                {`${member.username} (${member.email})`}
                            </option>
                        ))}
                    </select>
                </fieldset>

                <fieldset className="members-fieldset">
                    <legend>Paid For</legend>
                    <ul>
                        {groupMembers.map(member => (
                            <li key={member.user_id}>
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={!!paidFor[member.user_id]}
                                        onChange={() => handlePaidForChange(member.user_id)}
                                    />
                                    {`${member.username} (${member.email})`}
                                </label>
                            </li>
                        ))}
                    </ul>
                </fieldset>
                <div className="form-actions">
                    <button type="submit">
                        {editingExpense ? <EditIcon /> : <AddIcon />}
                    </button>
                    {editingExpense && (
                        <button type="button" onClick={handleCancelEdit}>
                            <CancelIcon />
                        </button>
                    )}
                </div>
                
            </div>
        </form>
    );
}

export default GroupExpenseForm;