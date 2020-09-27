/* eslint-disable react/prop-types */
import React from 'react';
import { Menu } from 'antd';

import { menuItems } from '../../constants';
import { Link } from 'react-router-dom';

export const MenuComponent = props => {
  const { activeMenuItem } = props;

  return (
    <Menu theme="dark" mode="horizontal" defaultSelectedKeys={activeMenuItem}>
      {menuItems.map(item => {
        return (
          <Menu.Item key={item.title}>
            <Link to={item.url}>{item.title}</Link>
          </Menu.Item>
        );
      })}
    </Menu>
  );
};
