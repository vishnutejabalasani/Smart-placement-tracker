const User = require('../models/User');
const bcrypt = require('bcryptjs');

describe('User Model - Cryptographic Hook Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should encrypt passwords via bcrypt hook on user registration / save', async () => {
    const userData = {
      name: 'Test Student',
      email: 'student@university.edu',
      password: 'plain_secret_password',
      role: 'student'
    };

    const user = new User(userData);
    
    // Explicitly force isModified to return true in the test runner
    Object.defineProperty(user, 'isModified', {
      value: () => true,
      configurable: true,
      writable: true
    });
    
    // Spies on the required bcryptjs module directly
    const genSaltSpy = jest.spyOn(bcrypt, 'genSalt').mockResolvedValue('fake_salt');
    const hashSpy = jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed_mock_password');

    // Simulate pre-save middleware trigger
    const nextMock = jest.fn((err) => {
      if (err) console.error('--- nextMock received error:', err);
    });
    
    // Dynamically locate the bcrypt pre-save hook in Mongoose's hook list
    const saveHooks = User.schema.s.hooks._pres.get('save') || [];
    const bcryptHook = saveHooks.find(hook => hook.fn.toString().includes('bcrypt')).fn;
    
    await bcryptHook.call(user, nextMock);

    expect(genSaltSpy).toHaveBeenCalledWith(10);
    expect(hashSpy).toHaveBeenCalledWith('plain_secret_password', 'fake_salt');
    expect(user.password).toBe('hashed_mock_password');
    expect(nextMock).toHaveBeenCalled();
  });

  it('should accurately compare credentials using comparePassword instance method', async () => {
    const user = new User({
      password: 'hashed_mock_password'
    });

    const compareSpy = jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

    const match = await user.comparePassword('plain_secret_password');
    expect(compareSpy).toHaveBeenCalledWith('plain_secret_password', 'hashed_mock_password');
    expect(match).toBe(true);
  });
});
