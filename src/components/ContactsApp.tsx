import React, { useState, useEffect } from 'react';
import { db } from '@/lib/rdbms';
import { Row } from '@/lib/rdbms/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  User, 
  Mail, 
  Phone, 
  Building,
  Search,
  X,
  Save
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Contact {
  id: number;
  name: string;
  email: string;
  phone: string;
  company: string;
}

export const ContactsApp: React.FC = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isEditing, setIsEditing] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
  });

  // Initialize database table
  useEffect(() => {
    const initResult = db.execute(`
      CREATE TABLE contacts (
        id INT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE,
        phone VARCHAR(50),
        company VARCHAR(100)
      )
    `);

    if (initResult.success) {
      // Add sample data
     db.execute("INSERT INTO contacts (name, email, phone, company) VALUES ('Wanjiku Kamau', 'wanjiku@safaricom.co.ke', '+254-722-345678', 'Safaricom PLC')");
db.execute("INSERT INTO contacts (name, email, phone, company) VALUES ('James Omondi', 'james@equitybank.co.ke', '+254-733-456789', 'Equity Bank')");
db.execute("INSERT INTO contacts (name, email, phone, company) VALUES ('Amina Hassan', 'amina@kplc.co.ke', '+254-700-567890', 'Kenya Power')");
db.execute("INSERT INTO contacts (name, email, phone, company) VALUES ('Peter Kipchoge', 'peter@kenyaairways.com', '+254-711-678901', 'Kenya Airways')");
db.execute("INSERT INTO contacts (name, email, phone, company) VALUES ('Grace Achieng', 'grace@kcb.co.ke', '+254-722-789012', 'KCB Bank')");
db.execute("INSERT INTO contacts (name, email, phone, company) VALUES ('Mohamed Ali', 'mohamed@twiga.com', '+254-733-890123', 'Twiga Foods')");
    }

    refreshContacts();
  }, []);

  const refreshContacts = () => {
    let query = 'SELECT * FROM contacts';
    if (searchTerm) {
      query += ` WHERE name LIKE '%${searchTerm}%' OR email LIKE '%${searchTerm}%' OR company LIKE '%${searchTerm}%'`;
    }
    query += ' ORDER BY name ASC';
    
    const result = db.execute(query);
    if (result.success && result.data) {
      setContacts(result.data as unknown as Contact[]);
    }
  };

  useEffect(() => {
    refreshContacts();
  }, [searchTerm]);

  const handleAdd = () => {
    if (!formData.name || !formData.email) {
      toast({
        title: 'Validation Error',
        description: 'Name and email are required',
        variant: 'destructive',
      });
      return;
    }

    const result = db.execute(`
      INSERT INTO contacts (name, email, phone, company) 
      VALUES ('${formData.name}', '${formData.email}', '${formData.phone}', '${formData.company}')
    `);

    if (result.success) {
      toast({
        title: 'Contact Added',
        description: `${formData.name} has been added to contacts`,
      });
      setIsAdding(false);
      setFormData({ name: '', email: '', phone: '', company: '' });
      refreshContacts();
    } else {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      });
    }
  };

  const handleUpdate = (id: number) => {
    const result = db.execute(`
      UPDATE contacts 
      SET name = '${formData.name}', email = '${formData.email}', phone = '${formData.phone}', company = '${formData.company}'
      WHERE id = ${id}
    `);

    if (result.success) {
      toast({
        title: 'Contact Updated',
        description: `${formData.name} has been updated`,
      });
      setIsEditing(null);
      setFormData({ name: '', email: '', phone: '', company: '' });
      refreshContacts();
    } else {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      });
    }
  };

  const handleDelete = (id: number, name: string) => {
    const result = db.execute(`DELETE FROM contacts WHERE id = ${id}`);

    if (result.success) {
      toast({
        title: 'Contact Deleted',
        description: `${name} has been removed`,
      });
      refreshContacts();
    }
  };

  const startEdit = (contact: Contact) => {
    setIsEditing(contact.id);
    setFormData({
      name: contact.name,
      email: contact.email,
      phone: contact.phone || '',
      company: contact.company || '',
    });
  };

  const cancelEdit = () => {
    setIsEditing(null);
    setIsAdding(false);
    setFormData({ name: '', email: '', phone: '', company: '' });
  };

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-card border-b border-border">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-primary" />
          <span className="font-semibold">Contacts Manager</span>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {contacts.length} contacts
          </span>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setIsAdding(true);
            setIsEditing(null);
          }}
          className="gap-1"
        >
          <Plus className="w-4 h-4" />
          Add
        </Button>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search contacts..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Add Form */}
      {isAdding && (
        <div className="p-4 border-b border-border bg-muted/30 animate-slide-up">
          <h4 className="font-medium mb-3">New Contact</h4>
          <ContactForm
            formData={formData}
            setFormData={setFormData}
            onSave={handleAdd}
            onCancel={cancelEdit}
          />
        </div>
      )}

      {/* Contact List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {contacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <User className="w-12 h-12 mb-2 opacity-50" />
            <p>No contacts found</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {contacts.map(contact => (
              <div key={contact.id} className="p-4 hover:bg-muted/30 transition-colors">
                {isEditing === contact.id ? (
                  <div className="animate-slide-up">
                    <ContactForm
                      formData={formData}
                      setFormData={setFormData}
                      onSave={() => handleUpdate(contact.id)}
                      onCancel={cancelEdit}
                    />
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{contact.name}</h4>
                      <div className="mt-1 space-y-0.5 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Mail className="w-3 h-3" />
                          <span className="truncate">{contact.email}</span>
                        </div>
                        {contact.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-3 h-3" />
                            <span>{contact.phone}</span>
                          </div>
                        )}
                        {contact.company && (
                          <div className="flex items-center gap-2">
                            <Building className="w-3 h-3" />
                            <span>{contact.company}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => startEdit(contact)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(contact.id, contact.name)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

interface ContactFormProps {
  formData: {
    name: string;
    email: string;
    phone: string;
    company: string;
  };
  setFormData: React.Dispatch<React.SetStateAction<{
    name: string;
    email: string;
    phone: string;
    company: string;
  }>>;
  onSave: () => void;
  onCancel: () => void;
}

const ContactForm: React.FC<ContactFormProps> = ({ formData, setFormData, onSave, onCancel }) => (
  <div className="space-y-3">
    <div className="grid grid-cols-2 gap-3">
      <div className="relative">
        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Name *"
          value={formData.name}
          onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
          className="pl-9"
        />
      </div>
      <div className="relative">
        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Email *"
          type="email"
          value={formData.email}
          onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
          className="pl-9"
        />
      </div>
      <div className="relative">
        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Phone"
          value={formData.phone}
          onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
          className="pl-9"
        />
      </div>
      <div className="relative">
        <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Company"
          value={formData.company}
          onChange={e => setFormData(prev => ({ ...prev, company: e.target.value }))}
          className="pl-9"
        />
      </div>
    </div>
    <div className="flex items-center gap-2">
      <Button size="sm" onClick={onSave} className="gap-1">
        <Save className="w-4 h-4" />
        Save
      </Button>
      <Button size="sm" variant="outline" onClick={onCancel} className="gap-1">
        <X className="w-4 h-4" />
        Cancel
      </Button>
    </div>
  </div>
);
